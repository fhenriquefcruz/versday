import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveBiblicalContext } from '../js/biblical-context.js';
import { analyzeVerse } from '../js/visualIntelligence.js';

test('Salmo 121:1 usa contexto adjacente e não transforma montes na resposta', () => {
  const context = resolveBiblicalContext({
    book: 'sl',
    chapter: 121,
    verse: 1
  });

  assert.equal(context.source, 'curated-context');
  assert.equal(context.granularity, 'passage-range');
  assert.equal(context.scope, 'sl 121:1-2');
  assert.ok(context.suppressLiteral.includes('montanha'));
  assert.match(context.text, /pergunta e resposta/i);
});

test('fora da faixa específica o contexto volta ao nível de capítulo', () => {
  const context = resolveBiblicalContext({
    book: 'sl',
    chapter: 121,
    verse: 3
  });

  assert.equal(context.source, 'curated-context');
  assert.equal(context.granularity, 'chapter');
  assert.equal(context.scope, 'sl 121');
});

test('contexto explícito do verso tem prioridade sobre curadoria', () => {
  const context = resolveBiblicalContext({
    book: 'mc',
    chapter: 4,
    verse: 37,
    context: 'Contexto fornecido diretamente pelo conteúdo.',
    narrativeSituation: 'situação explicitamente informada'
  });

  assert.equal(context.source, 'verse');
  assert.equal(context.granularity, 'explicit');
  assert.equal(context.text, 'Contexto fornecido diretamente pelo conteúdo.');
  assert.equal(context.narrativeSituation, 'situação explicitamente informada');
});

test('Isaías 43 usa faixa adjacente para manter águas e fogo como adversidade contextual', () => {
  const intent = analyzeVerse({
    text: 'Quando passares pelas águas, eu serei contigo; quando pelo fogo, não te queimarás.',
    reference: 'is 43:2',
    book: 'is',
    chapter: 43,
    verse: 2,
    theme: 'confianca'
  });

  assert.equal(intent.biblicalContext.contextSource, 'curated-context');
  assert.equal(intent.biblicalContext.contextGranularity, 'passage-range');
  assert.equal(intent.biblicalContext.contextScope, 'is 43:1-3');
  assert.ok(intent.biblicalContext.suppressedLiteralElements.includes('água'));
  assert.ok(intent.biblicalContext.suppressedLiteralElements.includes('fogo'));
  assert.ok(
    intent.representation.symbolicElements.some(item =>
      item.includes('água como imagem contextual')
    )
  );
});

test('contexto adjacente de tempestade preserva a situação narrativa literal', () => {
  const intent = analyzeVerse({
    text: 'Levantou-se grande tempestade, e as ondas cobriam o barco.',
    reference: 'mc 4:37',
    book: 'mc',
    chapter: 4,
    verse: 37,
    theme: 'tempestade'
  });

  assert.equal(intent.biblicalContext.contextGranularity, 'passage-range');
  assert.equal(intent.biblicalContext.contextScope, 'mc 4:35-41');
  assert.match(intent.biblicalContext.narrativeSituation, /tempestade literal/i);
  assert.match(intent.visualIntent.description, /Contexto:/);
});
