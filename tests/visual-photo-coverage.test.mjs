import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import { analyzeVerse } from '../js/visualIntelligence.js';
import { getCuratedCandidates } from '../js/visualCatalog.js';
import { selectBestCandidate } from '../js/visualSelector.js';

export const ABSTRACT_FIRST_THEMES = new Set([
  'morte',
  'guerra',
  'julgamento',
  'profecia',
  'ressurreicao',
  'lamento'
]);

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function evaluateCuratedPhotoCoverage(verses = FALLBACK_VERSES) {
  const byTheme = new Map();

  for (const verse of verses) {
    const intent = analyzeVerse(verse);
    const candidates = getCuratedCandidates(intent, 12);
    const { selected, ranked } = selectBestCandidate(
      candidates,
      intent,
      []
    );

    const theme = normalize(
      intent.semantic?.primaryTheme ||
      verse.theme ||
      'uncategorized'
    );

    const current = byTheme.get(theme) || {
      theme,
      total: 0,
      photo: 0,
      abstract: 0,
      selectedIds: new Set(),
      rejectedReasons: new Map(),
      topRejectedIds: new Map(),
      references: []
    };

    current.total += 1;
    if (selected) {
      current.photo += 1;
      current.selectedIds.add(selected.candidate.id);
    } else {
      current.abstract += 1;
      const topRejected = ranked?.[0] || null;
      if (topRejected) {
        for (const reason of topRejected.rejectedReasons || []) {
          current.rejectedReasons.set(
            reason,
            (current.rejectedReasons.get(reason) || 0) + 1
          );
        }
        const topId = topRejected.candidate?.id || 'unknown';
        current.topRejectedIds.set(
          topId,
          (current.topRejectedIds.get(topId) || 0) + 1
        );
      } else {
        current.rejectedReasons.set(
          'NO_CURATED_CANDIDATE',
          (current.rejectedReasons.get('NO_CURATED_CANDIDATE') || 0) + 1
        );
      }
    }
    current.references.push({
      reference: verse.reference,
      outcome: selected ? 'photo' : 'abstract',
      visualId: selected?.candidate?.id || null
    });

    byTheme.set(theme, current);
  }

  return [...byTheme.values()]
    .map(item => ({
      theme: item.theme,
      total: item.total,
      photo: item.photo,
      abstract: item.abstract,
      photoRate: item.total
        ? item.photo / item.total
        : 0,
      uniquePhotos: item.selectedIds.size,
      dominantRejectReason:
        [...item.rejectedReasons.entries()]
          .sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      topRejectedCandidate:
        [...item.topRejectedIds.entries()]
          .sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      references: item.references
    }))
    .sort((a, b) => {
      if (a.photoRate !== b.photoRate) {
        return a.photoRate - b.photoRate;
      }
      if (a.total !== b.total) return b.total - a.total;
      return a.theme.localeCompare(b.theme);
    });
}

test('diagnóstico de cobertura fotográfica por tema permanece calculável', t => {
  const report = evaluateCuratedPhotoCoverage();

  assert.ok(FALLBACK_VERSES.length >= 150);
  assert.ok(report.length >= 15);

  const totals = report.reduce(
    (acc, item) => {
      acc.total += item.total;
      acc.photo += item.photo;
      acc.abstract += item.abstract;
      return acc;
    },
    { total: 0, photo: 0, abstract: 0 }
  );

  assert.equal(totals.total, FALLBACK_VERSES.length);
  assert.equal(totals.photo + totals.abstract, totals.total);

  t.diagnostic(
    `Curated photo coverage: ${totals.photo}/${totals.total} (${(
      totals.photo / totals.total * 100
    ).toFixed(1)}%)`
  );

  for (const item of report) {
    const flag = ABSTRACT_FIRST_THEMES.has(item.theme)
      ? 'abstract-first'
      : 'photo-eligible';

    t.diagnostic(
      [
        item.theme,
        flag,
        `${item.photo}/${item.total}`,
        `${(item.photoRate * 100).toFixed(1)}%`,
        `uniquePhotos=${item.uniquePhotos}`,
        `reject=${item.dominantRejectReason || 'none'}`,
        `top=${item.topRejectedCandidate || 'none'}`
      ].join(' · ')
    );
  }
});

test('temas abstract-first nunca são obrigados a atingir cobertura fotográfica', () => {
  const report = evaluateCuratedPhotoCoverage();

  for (const item of report) {
    if (!ABSTRACT_FIRST_THEMES.has(item.theme)) continue;

    assert.ok(
      item.photoRate >= 0 && item.photoRate <= 1,
      `taxa inválida para ${item.theme}`
    );
  }
});