import { applyCors, readJsonBody } from './_cors.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_VISION_MODEL = 'qwen/qwen3.8-27b';
const MAX_CANDIDATES = 3;

const TRUSTED_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'images.pexels.com'
]);

function enabled() {
  return String(process.env.VISUAL_VLM_ENABLED || '')
    .trim()
    .toLowerCase() === 'true';
}

export function isTrustedImageUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return (
      url.protocol === 'https:' &&
      TRUSTED_IMAGE_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

export function normalizeVlmDecision(raw = {}) {
  const semanticCompatibility = clamp01(raw.semanticCompatibility);
  const emotionalCompatibility = clamp01(raw.emotionalCompatibility);
  const contradiction = Boolean(raw.contradiction);
  const unsafeOrCliche = Boolean(raw.unsafeOrCliche);
  const accepted =
    semanticCompatibility >= 0.72 &&
    emotionalCompatibility >= 0.62 &&
    !contradiction &&
    !unsafeOrCliche;

  return {
    id: String(raw.id || '').slice(0, 200),
    semanticCompatibility,
    emotionalCompatibility,
    contradiction,
    unsafeOrCliche,
    accepted,
    reason: String(raw.reason || '').trim().slice(0, 240)
  };
}

function normalizeCandidates(rawCandidates) {
  if (!Array.isArray(rawCandidates)) return [];

  return rawCandidates
    .slice(0, MAX_CANDIDATES)
    .map(candidate => ({
      id: String(candidate?.id || '').trim().slice(0, 200),
      imageUrl: String(candidate?.imageUrl || '').trim(),
      provider: String(candidate?.provider || '').trim().slice(0, 80),
      description: String(candidate?.description || '').trim().slice(0, 700),
      alt: String(candidate?.alt || '').trim().slice(0, 700),
      tags: Array.isArray(candidate?.tags)
        ? candidate.tags.slice(0, 16).map(tag => String(tag).slice(0, 80))
        : []
    }))
    .filter(candidate =>
      candidate.id &&
      isTrustedImageUrl(candidate.imageUrl)
    );
}

function buildPrompt(intent, candidates, verseReference, purpose) {
  const semantic = intent?.semantic || {};
  const representation = intent?.representation || {};
  const visualIntent = intent?.visualIntent || {};
  const biblicalContext = intent?.biblicalContext || {};

  return [
    'You are the final visual quality gate for VersDay, a contemplative Bible verse product.',
    'Evaluate each candidate image against the supplied biblical/visual intent.',
    'Do not reward beauty when semantic compatibility is weak.',
    'Reject contradiction, emotional mismatch, sensationalism, generic religious cliché, advertising, embedded text, graphic violence, or a scene that makes the verse feel randomly paired.',
    'For conceptual passages, compatible atmosphere can be valid without literal illustration.',
    'For literal narrative passages, concrete scene compatibility matters more.',
    '',
    `Verse reference: ${verseReference || 'unknown'}`,
    `Purpose: ${purpose || 'background'}`,
    `Primary theme: ${semantic.primaryTheme || ''}`,
    `Emotional tone: ${JSON.stringify(semantic.emotionalTone || [])}`,
    `Representation mode: ${representation.mode || ''}`,
    `Literal elements: ${JSON.stringify(representation.literalElements || [])}`,
    `Symbolic elements: ${JSON.stringify(representation.symbolicElements || [])}`,
    `Visual intent: ${visualIntent.description || ''}`,
    `Negative concepts: ${JSON.stringify(visualIntent.negativeConcepts || [])}`,
    `Biblical context: ${biblicalContext.surroundingContext || ''}`,
    `Narrative situation: ${biblicalContext.narrativeSituation || ''}`,
    '',
    'Return exactly one JSON object with this root shape: {"decisions":[...]}',
    'Each decision must contain: id, semanticCompatibility, emotionalCompatibility, contradiction, unsafeOrCliche, reason.',
    'Return one decision for every candidate in the same order and preserve the candidate id exactly.',
    'semanticCompatibility and emotionalCompatibility must be numbers from 0 to 1.',
    'contradiction and unsafeOrCliche must be booleans.',
    'reason must be short and concrete.',
    'Do not include markdown or prose outside the JSON object.'
  ].join('\n');
}

function buildMessageContent(prompt, candidates) {
  const content = [{ type: 'text', text: prompt }];

  candidates.forEach((candidate, index) => {
    content.push({
      type: 'text',
      text: [
        `Candidate ${index + 1}`,
        `id: ${candidate.id}`,
        `provider: ${candidate.provider || 'unknown'}`,
        `description: ${candidate.description || candidate.alt || ''}`,
        `tags: ${candidate.tags.join(', ')}`
      ].join('\n')
    });
    content.push({
      type: 'image_url',
      image_url: { url: candidate.imageUrl }
    });
  });

  return content;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!enabled() || !apiKey) {
    return res.status(503).json({
      error: 'Visual multimodal validator not configured',
      enabled: false,
      decisions: []
    });
  }

  try {
    const body = await readJsonBody(req, 36_000);
    const candidates = normalizeCandidates(body.candidates);

    if (!candidates.length) {
      return res.status(400).json({
        error: 'No trusted visual candidates'
      });
    }

    if (
      Array.isArray(body.candidates) &&
      candidates.length !== Math.min(body.candidates.length, MAX_CANDIDATES)
    ) {
      return res.status(400).json({
        error: 'Untrusted or invalid image URL'
      });
    }

    const prompt = buildPrompt(
      body.intent || {},
      candidates,
      String(body.verseReference || '').slice(0, 120),
      String(body.purpose || 'background').slice(0, 80)
    );

    const controller = new AbortController();
    const providerTimeout = setTimeout(
      () => controller.abort(),
      4_500
    );

    let response;
    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model:
            process.env.GROQ_VISION_MODEL ||
            DEFAULT_VISION_MODEL,
          messages: [
            {
              role: 'user',
              content: buildMessageContent(prompt, candidates)
            }
          ],
          temperature: 0.1,
          reasoning_effort: 'none',
          max_completion_tokens: 900,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(providerTimeout);
    }

    if (!response.ok) {
      console.error(
        '[VersDay API] visual validator Groq status:',
        response.status
      );
      return res.status(502).json({
        error: 'Visual multimodal validator failed',
        decisions: []
      });
    }

    const payload = await response.json();
    const rawContent = String(
      payload.choices?.[0]?.message?.content || ''
    ).trim();

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return res.status(502).json({
        error: 'Invalid visual validator response',
        decisions: []
      });
    }

    const rawDecisions = Array.isArray(parsed.decisions)
      ? parsed.decisions
      : [];

    const byId = new Map(
      rawDecisions
        .map(normalizeVlmDecision)
        .filter(decision => decision.id)
        .map(decision => [decision.id, decision])
    );

    const decisions = candidates.map(candidate => {
      const decision = byId.get(candidate.id);
      return decision || {
        id: candidate.id,
        semanticCompatibility: 0,
        emotionalCompatibility: 0,
        contradiction: true,
        unsafeOrCliche: false,
        accepted: false,
        reason: 'Validator omitted this candidate.'
      };
    });

    return res.status(200).json({
      enabled: true,
      model:
        process.env.GROQ_VISION_MODEL ||
        DEFAULT_VISION_MODEL,
      decisions
    });
  } catch (error) {
    console.error('[VersDay API] visual-validate:', error);
    return res.status(
      error.message === 'Payload too large' ? 413 : 500
    ).json({
      error: 'Visual multimodal validation failed',
      decisions: []
    });
  }
}