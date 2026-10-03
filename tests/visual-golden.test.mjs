import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeVerse,
  buildVisualQueries,
  getThemeProfile
} from '../js/visualIntelligence.js';

const CASES = [
  {
    name: 'confiança não vira montanha genérica',
    verse: {
      text: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
      reference: 'pv 3:5',
      book: 'pv',
      chapter: 3,
      verse: 5,
      theme: 'confianca'
    },
    primary: 'confiança',
    mode: 'conceptual',
    forbiddenQuery: /mountain/i
  },
  {
    name: 'Salmo 121 não transforma os montes na resposta da passagem',
    verse: {
      text: 'Elevo os meus olhos para os montes; de onde me virá o socorro?',
      reference: 'sl 121:1-2',
      book: 'sl',
      chapter: 121,
      verse: 1,
      theme: 'confianca'
    },
    primary: 'confiança',
    mode: 'conceptual',
    suppressed: ['montanha'],
    forbiddenLiteral: ['montanha'],
    forbiddenQuery: /mountain/i
  },
  {
    name: 'Isaías 43 trata águas e fogo como imagens de adversidade, não cenário obrigatório',
    verse: {
      text: 'Quando passares pelas águas, eu serei contigo; quando passares pelo fogo, não te queimarás.',
      reference: 'is 43:2',
      book: 'is',
      chapter: 43,
      verse: 2,
      theme: 'confianca'
    },
    primary: 'confiança',
    mode: 'conceptual',
    suppressed: ['água', 'fogo'],
    forbiddenLiteral: ['água', 'fogo'],
    forbiddenQuery: /river|water|furnace|fire/i
  },
  {
    name: 'fornalha de Daniel permanece literal quando o fogo é parte do evento',
    verse: {
      text: 'Vejo quatro homens soltos, que andam passeando dentro do fogo, sem sofrer nenhum dano.',
      reference: 'dn 3:25',
      book: 'dn',
      chapter: 3,
      verse: 25,
      theme: 'coragem'
    },
    primary: 'coragem',
    mode: 'literal',
    requiredLiteral: ['fogo'],
    requiredQuery: /fire furnace/i
  },
  {
    name: 'prisão em Atos 16 entra como contexto literal sem reduzir oração a mãos postas',
    verse: {
      text: 'Por volta da meia-noite, Paulo e Silas oravam e cantavam; as cadeias estavam presas.',
      reference: 'atos 16:25',
      book: 'atos',
      chapter: 16,
      verse: 25,
      theme: 'oracao'
    },
    primary: 'oração',
    mode: 'literal',
    requiredLiteral: ['prisão'],
    requiredQuery: /prison/i
  },
  {
    name: 'guerra em 1 Samuel 17 preserva a tensão literal sem glorificação',
    verse: {
      text: 'Tu vens contra mim com espada, lança e escudo; eu, porém, vou contra ti em nome do Senhor.',
      reference: '1sm 17:45',
      book: '1sm',
      chapter: 17,
      verse: 45,
      theme: 'guerra'
    },
    primary: 'guerra',
    mode: 'literal',
    requiredLiteral: ['batalha'],
    requiredQuery: /conflict landscape/i
  },
  {
    name: 'ressurreição doutrinária em 1 Coríntios 15 não inventa túmulo',
    verse: {
      text: 'Tragada foi a morte pela vitória. Onde está, ó morte, a tua vitória?',
      reference: '1co 15:54-55',
      book: '1co',
      chapter: 15,
      verse: 54,
      theme: 'ressurreicao'
    },
    primary: 'ressurreição',
    mode: 'conceptual',
    forbiddenLiteral: ['túmulo'],
    forbiddenQuery: /tomb/i
  },
  {
    name: 'Mateus 28 usa contexto de ressurreição sem fabricar literal ausente do verso',
    verse: {
      text: 'Ele não está aqui, porque ressuscitou, como havia dito.',
      reference: 'mt 28:6',
      book: 'mt',
      chapter: 28,
      verse: 6,
      theme: 'ressurreicao'
    },
    primary: 'ressurreição',
    mode: 'conceptual',
    forbiddenLiteral: ['túmulo'],
    forbiddenQuery: /tomb/i,
    curatedContext: true
  },
  {
    name: 'morte evita morbidez e permanece sóbria',
    verse: {
      text: 'Jesus, clamando outra vez com grande voz, entregou o espírito.',
      reference: 'mt 27:50',
      book: 'mt',
      chapter: 27,
      verse: 50,
      theme: 'morte'
    },
    primary: 'morte',
    mode: 'conceptual',
    negativeConcept: /cadáver|violência gráfica|terror/i
  },
  {
    name: 'justiça não se reduz a martelo ou tribunal',
    verse: {
      text: 'Se fazeis acepção de pessoas, cometeis pecado.',
      reference: 'tg 2:9',
      book: 'tg',
      chapter: 2,
      verse: 9,
      theme: 'justica'
    },
    primary: 'justiça',
    mode: 'conceptual',
    negativeConcept: /martelo de juiz|tribunal/i
  },
  {
    name: 'Salmo 137 não vira paisagem bonita de rio',
    verse: {
      text: 'Junto aos rios da Babilônia, ali nos assentamos e choramos, lembrando-nos de Sião.',
      reference: 'sl 137:1',
      book: 'sl',
      chapter: 137,
      verse: 1,
      theme: 'lamento'
    },
    primary: 'lamento',
    mode: 'conceptual',
    suppressed: ['água'],
    forbiddenLiteral: ['água'],
    forbiddenQuery: /river|water/i
  },
  {
    name: 'Apocalipse 6 evita literalismo bélico sensacionalista',
    verse: {
      text: 'Ao que estava sentado sobre ele foi-lhe dada uma grande espada.',
      reference: 'ap 6:4',
      book: 'ap',
      chapter: 6,
      verse: 4,
      theme: 'julgamento'
    },
    primary: 'julgamento',
    mode: 'conceptual',
    suppressed: ['batalha'],
    forbiddenLiteral: ['batalha'],
    forbiddenQuery: /conflict landscape|weapon/i
  },
  {
    name: 'reconciliação privilegia vínculo humano real',
    verse: {
      text: 'Levantou-se e foi para seu pai; vinha ele ainda longe, quando seu pai o avistou.',
      reference: 'lc 15:20',
      book: 'lc',
      chapter: 15,
      verse: 20,
      theme: 'reconciliacao'
    },
    primary: 'reconciliação',
    mode: 'conceptual',
    humanPresence: 'preferred',
    curatedContext: true
  },
  {
    name: 'sofrimento em Romanos 8 não antecipa euforia',
    verse: {
      text: 'Os sofrimentos do tempo presente não podem ser comparados com a glória a ser revelada.',
      reference: 'rm 8:18',
      book: 'rm',
      chapter: 8,
      verse: 18,
      theme: 'sofrimento'
    },
    primary: 'sofrimento',
    mode: 'conceptual',
    negativeConcept: /vitória precoce|celebração/i
  }
];

test('novos perfis semânticos difíceis existem explicitamente', () => {
  for (const theme of [
    'sofrimento',
    'medo',
    'morte',
    'ressurreicao',
    'justica',
    'guerra',
    'profecia',
    'lamento',
    'julgamento',
    'reconciliacao',
    'relacionamento'
  ]) {
    assert.ok(getThemeProfile(theme), `perfil ausente: ${theme}`);
  }
});

for (const item of CASES) {
  test(`golden · ${item.name}`, () => {
    const intent = analyzeVerse(item.verse);
    const queries = buildVisualQueries(intent);
    const queryText = queries.map(query => query.query).join(' | ');
    const negativeText = intent.visualIntent.negativeConcepts.join(' | ');

    assert.equal(intent.semantic.primaryTheme, item.primary);
    assert.equal(intent.representation.mode, item.mode);
    assert.ok(queries.length >= 1 && queries.length <= 4);

    if (item.requiredLiteral) {
      for (const literal of item.requiredLiteral) {
        assert.ok(
          intent.representation.literalElements.includes(literal),
          `literal esperado ausente: ${literal} em ${item.verse.reference}`
        );
      }
    }

    if (item.forbiddenLiteral) {
      for (const literal of item.forbiddenLiteral) {
        assert.equal(
          intent.representation.literalElements.includes(literal),
          false,
          `literal indevido: ${literal} em ${item.verse.reference}`
        );
      }
    }

    if (item.suppressed) {
      for (const literal of item.suppressed) {
        assert.ok(
          intent.biblicalContext.suppressedLiteralElements.includes(literal),
          `supressão contextual ausente: ${literal}`
        );
        assert.ok(
          intent.representation.symbolicElements.some(value =>
            value.includes(`${literal} como imagem contextual`)
          ),
          `sinal suprimido não foi preservado semanticamente: ${literal}`
        );
      }
    }

    if (item.requiredQuery) {
      assert.match(queryText, item.requiredQuery);
    }

    if (item.forbiddenQuery) {
      assert.doesNotMatch(queryText, item.forbiddenQuery);
    }

    if (item.negativeConcept) {
      assert.match(negativeText, item.negativeConcept);
    }

    if (item.humanPresence) {
      assert.equal(intent.photography.humanPresence, item.humanPresence);
    }

    if (item.curatedContext) {
      assert.equal(intent.biblicalContext.contextSource, 'curated-context');
    }
  });
}
