import {
  getVisualTelemetryEntries,
  summarizeVisualTelemetry,
  clearVisualTelemetry
} from './visualTelemetry.js';

const PANEL_ID = 'visualDebugPanel';

export function isVisualDebugEnabled(search = null) {
  const raw = search !== null
    ? String(search)
    : (typeof location !== 'undefined' ? location.search : '');

  try {
    return new URLSearchParams(raw).get('visualDebug') === '1';
  } catch {
    return false;
  }
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number * factor) / factor;
}

function compactRanked(ranked = []) {
  if (!Array.isArray(ranked)) return [];

  return ranked.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    id: String(item?.id || '').slice(0, 120),
    accepted: Boolean(item?.accepted),
    final: round(item?.scores?.final),
    semantic: round(item?.scores?.semantic),
    emotional: round(item?.scores?.emotional),
    composition: round(item?.scores?.composition),
    reasons: Array.isArray(item?.rejectedReasons)
      ? item.rejectedReasons.slice(0, 6).map(String)
      : [],
    vlm: item?.vlmValidation
      ? {
          accepted: Boolean(item.vlmValidation.accepted),
          semanticCompatibility: round(
            item.vlmValidation.semanticCompatibility
          ),
          emotionalCompatibility: round(
            item.vlmValidation.emotionalCompatibility
          ),
          reason: String(item.vlmValidation.reason || '').slice(0, 180)
        }
      : null
  }));
}

export function buildVisualDebugViewModel(selection = {}) {
  const intent = selection.intent || {};
  const visual = selection.visual || {};
  const diagnostics = selection.diagnostics || {};
  const summary = summarizeVisualTelemetry();

  return {
    reference: String(intent.verseReference || '').slice(0, 120),
    theme: String(intent.semantic?.primaryTheme || '').slice(0, 80),
    representation: String(
      intent.representation?.mode || ''
    ).slice(0, 40),
    context: {
      source: String(
        intent.biblicalContext?.contextSource || ''
      ).slice(0, 80),
      granularity: String(
        intent.biblicalContext?.contextGranularity || ''
      ).slice(0, 80),
      scope: String(
        intent.biblicalContext?.contextScope || ''
      ).slice(0, 120)
    },
    visual: {
      mode: String(visual.mode || ''),
      id: String(visual.id || '').slice(0, 160),
      provider: String(visual.provider || ''),
      score: round(visual.score),
      semanticScore: round(visual.semanticScore),
      compositionScore: round(visual.compositionScore),
      textPlacement: String(visual.textPlacement || ''),
      tabletTextPlacement: String(
        visual.tabletTextPlacement || ''
      ),
      mobileTextPlacement: String(
        visual.mobileTextPlacement || ''
      ),
      overlayStrength: round(visual.overlayStrength),
      focalPoint: visual.focalPoint || null,
      tabletFocalPoint: visual.tabletFocalPoint || null,
      mobileFocalPoint: visual.mobileFocalPoint || null
    },
    decision: {
      code: String(
        diagnostics.decision?.code || ''
      ).slice(0, 100),
      dominantRejectReason:
        diagnostics.decision?.dominantRejectReason || null,
      source: String(diagnostics.source || ''),
      candidateCount: Number(diagnostics.candidateCount || 0),
      providerCandidateCount: Number(
        diagnostics.providerCandidateCount || 0
      ),
      curatedCandidateCount: Number(
        diagnostics.curatedCandidateCount || 0
      ),
      analyzedCandidateCount: Number(
        diagnostics.analyzedCandidateCount || 0
      )
    },
    timings: {
      totalMs: round(diagnostics.timings?.totalMs, 1),
      acquisitionMs: round(
        diagnostics.timings?.acquisitionMs,
        1
      ),
      pixelAnalysisMs: round(
        diagnostics.timings?.pixelAnalysisMs,
        1
      ),
      vlmMs: round(diagnostics.timings?.vlmMs, 1),
      finalRankingMs: round(
        diagnostics.timings?.finalRankingMs,
        1
      )
    },
    vlm: {
      enabled: Boolean(diagnostics.vlm?.enabled),
      reason: diagnostics.vlm?.reason || null,
      model: diagnostics.vlm?.model || null,
      evaluatedCount: Number(
        diagnostics.vlm?.evaluatedCount || 0
      ),
      rejectedIds: Array.isArray(
        diagnostics.vlm?.rejectedIds
      )
        ? diagnostics.vlm.rejectedIds.slice(0, 3).map(String)
        : []
    },
    ranked: compactRanked(diagnostics.ranked),
    session: summary
  };
}

function createElement(tag, className, text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== '') element.textContent = String(text);
  return element;
}

function valueText(value, fallback = '—') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
}

function addMetric(grid, label, value) {
  const item = createElement('div', 'visual-debug-metric');
  item.append(
    createElement('span', 'visual-debug-label', label),
    createElement(
      'strong',
      'visual-debug-value',
      valueText(value)
    )
  );
  grid.appendChild(item);
}

function renderRanked(container, ranked) {
  const section = createElement('section', 'visual-debug-section');
  section.appendChild(
    createElement('h3', '', 'Top candidatos')
  );

  if (!ranked.length) {
    section.appendChild(
      createElement('p', 'visual-debug-empty', 'Sem ranking disponível.')
    );
    container.appendChild(section);
    return;
  }

  const list = createElement('div', 'visual-debug-ranking');

  ranked.forEach(item => {
    const row = createElement(
      'div',
      `visual-debug-candidate ${item.accepted ? 'is-accepted' : 'is-rejected'}`
    );

    const head = createElement('div', 'visual-debug-candidate-head');
    head.append(
      createElement(
        'strong',
        '',
        `#${item.rank} · ${item.id || 'sem-id'}`
      ),
      createElement(
        'span',
        '',
        item.accepted ? 'ACEITO' : 'REJEITADO'
      )
    );

    const scores = createElement(
      'div',
      'visual-debug-candidate-scores',
      [
        `final ${valueText(item.final)}`,
        `sem ${valueText(item.semantic)}`,
        `emo ${valueText(item.emotional)}`,
        `comp ${valueText(item.composition)}`
      ].join(' · ')
    );

    row.append(head, scores);

    if (item.reasons.length) {
      row.appendChild(
        createElement(
          'div',
          'visual-debug-reasons',
          item.reasons.join(' · ')
        )
      );
    }

    if (item.vlm) {
      row.appendChild(
        createElement(
          'div',
          'visual-debug-vlm-note',
          `VLM: ${item.vlm.accepted ? 'aceito' : 'rejeitado'} · ${item.vlm.reason || 'sem motivo'}`
        )
      );
    }

    list.appendChild(row);
  });

  section.appendChild(list);
  container.appendChild(section);
}

function getOrCreatePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;

  panel = createElement('aside', 'visual-debug-panel');
  panel.id = PANEL_ID;
  panel.setAttribute('aria-label', 'Diagnóstico visual do VersDay');

  const header = createElement('div', 'visual-debug-header');
  const title = createElement('strong', '', 'Visual Debug');

  const actions = createElement('div', 'visual-debug-actions');
  const clear = createElement('button', '', 'Limpar');
  clear.type = 'button';
  clear.title = 'Limpar telemetria desta sessão';

  const toggle = createElement('button', '', '−');
  toggle.type = 'button';
  toggle.title = 'Recolher painel';
  toggle.setAttribute('aria-expanded', 'true');

  actions.append(clear, toggle);
  header.append(title, actions);

  const body = createElement('div', 'visual-debug-body');
  panel.append(header, body);
  document.body.appendChild(panel);

  clear.addEventListener('click', () => {
    clearVisualTelemetry();
    panel.dispatchEvent(
      new CustomEvent('versday:visual-debug-refresh')
    );
  });

  toggle.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('is-collapsed');
    toggle.textContent = collapsed ? '+' : '−';
    toggle.title = collapsed ? 'Expandir painel' : 'Recolher painel';
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });

  return panel;
}

function renderPanelBody(panel, model) {
  const body = panel.querySelector('.visual-debug-body');
  if (!body) return;

  body.replaceChildren();

  const decisionSection = createElement(
    'section',
    'visual-debug-section'
  );
  decisionSection.appendChild(
    createElement('h3', '', 'Decisão')
  );

  const decisionGrid = createElement(
    'div',
    'visual-debug-grid'
  );
  addMetric(decisionGrid, 'Ref.', model.reference);
  addMetric(decisionGrid, 'Tema', model.theme);
  addMetric(
    decisionGrid,
    'Representação',
    model.representation
  );
  addMetric(
    decisionGrid,
    'Decisão',
    model.decision.code
  );
  addMetric(
    decisionGrid,
    'Fonte',
    model.decision.source
  );
  addMetric(
    decisionGrid,
    'Motivo',
    model.decision.dominantRejectReason
  );
  decisionSection.appendChild(decisionGrid);

  const visualSection = createElement(
    'section',
    'visual-debug-section'
  );
  visualSection.appendChild(
    createElement('h3', '', 'Visual')
  );
  const visualGrid = createElement('div', 'visual-debug-grid');
  addMetric(visualGrid, 'Modo', model.visual.mode);
  addMetric(visualGrid, 'Provider', model.visual.provider);
  addMetric(visualGrid, 'ID', model.visual.id);
  addMetric(visualGrid, 'Score', model.visual.score);
  addMetric(
    visualGrid,
    'Semântico',
    model.visual.semanticScore
  );
  addMetric(
    visualGrid,
    'Composição',
    model.visual.compositionScore
  );
  addMetric(
    visualGrid,
    'Texto desktop',
    model.visual.textPlacement
  );
  addMetric(
    visualGrid,
    'Texto tablet',
    model.visual.tabletTextPlacement
  );
  addMetric(
    visualGrid,
    'Texto mobile',
    model.visual.mobileTextPlacement
  );
  visualSection.appendChild(visualGrid);

  const timingSection = createElement(
    'section',
    'visual-debug-section'
  );
  timingSection.appendChild(
    createElement('h3', '', 'Performance')
  );
  const timingGrid = createElement('div', 'visual-debug-grid');
  addMetric(timingGrid, 'Total', `${valueText(model.timings.totalMs)} ms`);
  addMetric(
    timingGrid,
    'Busca',
    `${valueText(model.timings.acquisitionMs)} ms`
  );
  addMetric(
    timingGrid,
    'Pixels',
    `${valueText(model.timings.pixelAnalysisMs)} ms`
  );
  addMetric(
    timingGrid,
    'VLM',
    `${valueText(model.timings.vlmMs)} ms`
  );
  addMetric(
    timingGrid,
    'Ranking',
    `${valueText(model.timings.finalRankingMs)} ms`
  );
  addMetric(
    timingGrid,
    'Candidatos',
    model.decision.candidateCount
  );
  timingSection.appendChild(timingGrid);

  const contextSection = createElement(
    'section',
    'visual-debug-section'
  );
  contextSection.appendChild(
    createElement('h3', '', 'Contexto')
  );
  const contextGrid = createElement('div', 'visual-debug-grid');
  addMetric(
    contextGrid,
    'Origem',
    model.context.source
  );
  addMetric(
    contextGrid,
    'Granularidade',
    model.context.granularity
  );
  addMetric(
    contextGrid,
    'Escopo',
    model.context.scope
  );
  addMetric(
    contextGrid,
    'VLM',
    model.vlm.enabled
      ? `${model.vlm.model || 'ativo'} · ${model.vlm.evaluatedCount}`
      : model.vlm.reason || 'desligado'
  );
  contextSection.appendChild(contextGrid);

  const sessionSection = createElement(
    'section',
    'visual-debug-section'
  );
  sessionSection.appendChild(
    createElement('h3', '', 'Sessão')
  );
  const sessionGrid = createElement('div', 'visual-debug-grid');
  addMetric(
    sessionGrid,
    'Amostras',
    model.session.samples
  );
  addMetric(
    sessionGrid,
    'Fotos',
    model.session.photoCount
  );
  addMetric(
    sessionGrid,
    'Fallbacks',
    model.session.fallbackCount
  );
  addMetric(
    sessionGrid,
    'Cache',
    model.session.cacheCount
  );
  addMetric(
    sessionGrid,
    'Média',
    `${valueText(model.session.averageTotalMs)} ms`
  );
  addMetric(
    sessionGrid,
    'p95',
    `${valueText(model.session.p95TotalMs)} ms`
  );
  sessionSection.appendChild(sessionGrid);

  body.append(
    decisionSection,
    visualSection,
    timingSection,
    contextSection,
    sessionSection
  );

  renderRanked(body, model.ranked);
}

let lastSelection = null;

export function initVisualDebugPanel() {
  if (!isVisualDebugEnabled()) return null;

  const panel = getOrCreatePanel();
  panel.addEventListener('versday:visual-debug-refresh', () => {
    if (lastSelection) {
      renderPanelBody(
        panel,
        buildVisualDebugViewModel(lastSelection)
      );
    }
  });

  return panel;
}

export function renderVisualDebugPanel(selection) {
  if (!isVisualDebugEnabled() || !selection) return;

  lastSelection = selection;
  const panel = getOrCreatePanel();
  renderPanelBody(
    panel,
    buildVisualDebugViewModel(selection)
  );
}