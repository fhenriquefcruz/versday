import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  escapeHtml,
  formatAssistantHtml
} from '../js/chat.js';

test('assistant HTML is escaped before lightweight markdown rendering', () => {
  const malicious =
    '<img src=x onerror="alert(1)"> **seguro** *itálico*';

  const rendered = formatAssistantHtml(malicious);

  assert.doesNotMatch(rendered, /<img/i);
  assert.doesNotMatch(rendered, /onerror=/i);
  assert.match(rendered, /&lt;img/);
  assert.match(rendered, /<strong>seguro<\/strong>/);
  assert.match(rendered, /<em>itálico<\/em>/);
});

test('user content escapes HTML-sensitive characters', () => {
  assert.equal(
    escapeHtml('<script>"x" & \'y\'</script>'),
    '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;'
  );
});

test('provider client keeps answers as plain text instead of HTML', async () => {
  const source = await readFile(
    new URL('../js/gemini.js', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /<strong>\$1<\/strong>/);
  assert.doesNotMatch(source, /<em>\$1<\/em>/);
  assert.doesNotMatch(source, /<br>/);
  assert.match(source, /return String\(/);
});

test('chat never inserts raw assistant response directly into innerHTML', async () => {
  const source = await readFile(
    new URL('../js/chat.js', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /Assistente Teológico<\/strong>\$\{formatAssistantHtml\(text\)\}/
  );
  assert.doesNotMatch(
    source,
    /Assistente Teológico<\/strong>\$\{text\}/
  );
});

test('example env uses current Groq model and keeps VLM off by default', async () => {
  const env = await readFile(
    new URL('../.env.example', import.meta.url),
    'utf8'
  );

  assert.match(env, /GROQ_MODEL=qwen\/qwen3\.8-27b/);
  assert.match(env, /GROQ_VISION_MODEL=qwen\/qwen3\.8-27b/);
  assert.match(env, /VISUAL_VLM_ENABLED=false/);
  assert.doesNotMatch(env, /llama-3\.3-70b-versatile/);
});
