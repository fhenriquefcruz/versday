// Orquestração visual do VersDay: seleção semântica, crossfade, crop e feedback.
import { resolveVisualForVerse, createAbstractFallback } from './visual-engine.js';
import { recordVisualFeedback } from './visual-memory.js';
import { appState } from './state.js';

let bgLayer1, bgLayer2;
let activeLayer = 1;
let currentVisualKey = '';
let requestSequence = 0;

export function initBackgroundLayers() {
  if (document.querySelector('.bg-layer-1')) return;
  const l1 = document.createElement('div');
  l1.className = 'bg-layer bg-layer-1';
  const l2 = document.createElement('div');
  l2.className = 'bg-layer bg-layer-2';
  document.body.prepend(l2);
  document.body.prepend(l1);
  bgLayer1 = l1;
  bgLayer2 = l2;
}

function preloadImage(url, timeoutMs=6000) {
  return new Promise(resolve => {
    if (!url) return resolve(false);
    const img = new Image();
    let done = false;
    const finish = value => { if (!done) { done=true; clearTimeout(timer); resolve(value); } };
    const timer = setTimeout(()=>finish(false),timeoutMs);
    img.onload = ()=>finish(img.naturalWidth > 0);
    img.onerror = ()=>finish(false);
    img.src = url;
  });
}

function visualKey(selection) {
  return selection.kind === 'image' ? `image:${selection.imageId}` : `abstract:${selection.intent?.semantic?.primaryTheme}:${selection.reason}`;
}

function applyLayer(selection) {
  const nextLayer = activeLayer === 1 ? bgLayer2 : bgLayer1;
  const currentLayer = activeLayer === 1 ? bgLayer1 : bgLayer2;
  const fp = selection.focalPoint || {x:0.5,y:0.5};

  nextLayer.style.backgroundPosition = `${Math.round(fp.x*100)}% ${Math.round(fp.y*100)}%`;
  nextLayer.dataset.kind = selection.kind;
  if (selection.kind === 'image') {
    nextLayer.style.backgroundImage = `url("${selection.imageUrl.replace(/"/g,'%22')}")`;
  } else {
    nextLayer.style.backgroundImage = selection.abstract?.css || 'linear-gradient(145deg,#0d1117,#21313d)';
  }
  nextLayer.style.opacity = '1';
  currentLayer.style.opacity = '0';
  activeLayer = activeLayer === 1 ? 2 : 1;

  document.documentElement.style.setProperty('--visual-overlay-strength', String(selection.overlay?.strength ?? 0.34));
  document.body.dataset.visualKind = selection.kind;
  document.body.dataset.textPlacement = selection.textPlacement || 'center';
}

function appendLink(parent, label, href) {
  if (!href) { parent.append(document.createTextNode(label)); return; }
  const a = document.createElement('a');
  a.textContent = label;
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  parent.append(a);
}

function renderCredit(selection, verse) {
  const container = document.getElementById('unsplash-credit');
  if (!container) return;
  container.replaceChildren();

  if (selection.kind === 'image' && selection.attribution) {
    const credit = document.createElement('span');
    credit.className = 'visual-credit-text';
    credit.append(document.createTextNode('Imagem: '));
    if (selection.attribution.photographer) {
      appendLink(credit, selection.attribution.photographer, selection.attribution.photographerLink);
      credit.append(document.createTextNode(' · '));
    }
    appendLink(credit, selection.attribution.providerName || 'Fonte', selection.attribution.providerPage);
    container.append(credit);
  } else {
    const label = document.createElement('span');
    label.className = 'visual-credit-text';
    label.textContent = 'Composição editorial VersDay';
    container.append(label);
  }

  if (selection.kind === 'image' && selection.imageId) {
    const feedback = document.createElement('span');
    feedback.className = 'visual-feedback';
    const up = document.createElement('button');
    const down = document.createElement('button');
    up.type='button'; down.type='button';
    up.className='visual-feedback-btn'; down.className='visual-feedback-btn';
    up.textContent='👍'; down.textContent='👎';
    up.title='Combinou com a passagem'; down.title='Não combinou com a passagem';
    up.setAttribute('aria-label','Imagem combinou com a passagem');
    down.setAttribute('aria-label','Imagem não combinou com a passagem');
    up.addEventListener('click',()=>{
      recordVisualFeedback(verse.reference,selection.imageId,'up');
      up.classList.add('is-selected');
      down.disabled=true;
    },{once:true});
    down.addEventListener('click',async()=>{
      recordVisualFeedback(verse.reference,selection.imageId,'down');
      down.classList.add('is-selected');
      up.disabled=true; down.disabled=true;
      await setBackgroundImage(verse,{forceRefresh:true});
    },{once:true});
    feedback.append(up,down);
    container.append(feedback);
  }
  container.style.display = 'flex';
}

async function applySelection(selection, verse, seq) {
  if (seq !== requestSequence) return;
  let finalSelection = selection;
  if (selection.kind === 'image') {
    const loaded = await preloadImage(selection.imageUrl);
    if (seq !== requestSequence) return;
    if (!loaded) finalSelection = createAbstractFallback(verse,'IMAGE_LOAD_FAILURE');
  }

  const key = visualKey(finalSelection);
  if (key !== currentVisualKey) {
    applyLayer(finalSelection);
    currentVisualKey = key;
  }

  appState.currentVisualSelection = finalSelection;
  appState.currentBackgroundImageUrl = finalSelection.kind === 'image' ? finalSelection.imageUrl : '';
  renderCredit(finalSelection,verse);
}

export async function setBackgroundImage(verse, options={}) {
  if (!verse) return;
  if (!bgLayer1 || !bgLayer2) initBackgroundLayers();
  const seq = ++requestSequence;
  try {
    const selection = await resolveVisualForVerse(verse,options);
    await applySelection(selection,verse,seq);
  } catch (error) {
    console.error('[VersDay Visual] Falha na seleção visual:',error);
    await applySelection(createAbstractFallback(verse,'PIPELINE_FAILURE'),verse,seq);
  }
}
