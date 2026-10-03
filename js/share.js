// Share Engine VersDay — formatos independentes, crop por focal point e fallback abstrato.
import { appState } from './state.js';
import { resolveVisualForVerse } from './visualEngine.js';

const BOOK_NAMES = {
  gn:'Gênesis',ex:'Êxodo',lv:'Levítico',nm:'Números',dt:'Deuteronômio',js:'Josué',jz:'Juízes',rt:'Rute','1sm':'1 Samuel','2sm':'2 Samuel','1rs':'1 Reis','2rs':'2 Reis','1cr':'1 Crônicas','2cr':'2 Crônicas',ed:'Esdras',ne:'Neemias',et:'Ester','jó':'Jó',sl:'Salmos',pv:'Provérbios',ec:'Eclesiastes',ct:'Cantares',is:'Isaías',jr:'Jeremias',lm:'Lamentações',ez:'Ezequiel',dn:'Daniel',os:'Oséias',jl:'Joel',am:'Amós',ob:'Obadias',jn:'Jonas',mq:'Miquéias',na:'Naum',hc:'Habacuque',sf:'Sofonias',ag:'Ageu',zc:'Zacarias',ml:'Malaquias',mt:'Mateus',mc:'Marcos',lc:'Lucas',jo:'João',atos:'Atos',rm:'Romanos','1co':'1 Coríntios','2co':'2 Coríntios',gl:'Gálatas',ef:'Efésios',fp:'Filipenses',cl:'Colossenses','1ts':'1 Tessalonicenses','2ts':'2 Tessalonicenses','1tm':'1 Timóteo','2tm':'2 Timóteo',tt:'Tito',fm:'Filemom',hb:'Hebreus',tg:'Tiago','1pe':'1 Pedro','2pe':'2 Pedro','1jo':'1 João','2jo':'2 João','3jo':'3 João',jd:'Judas',ap:'Apocalipse'
};

export const SHARE_FORMATS = Object.freeze({
  story: { width:1080,height:1920,safeTop:250,safeBottom:300,label:'Story' },
  feed: { width:1080,height:1350,safeTop:150,safeBottom:150,label:'Feed vertical' },
  square: { width:1080,height:1080,safeTop:120,safeBottom:120,label:'Quadrado' },
  og: { width:1200,height:630,safeTop:70,safeBottom:70,label:'Open Graph' }
});

function getBookName(abbrev){ return BOOK_NAMES[abbrev] || abbrev; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

function wrapText(ctx,text,maxWidth){
  const words=String(text).split(/\s+/); const lines=[]; let current='';
  for(const word of words){ const test=current?`${current} ${word}`:word; if(ctx.measureText(test).width>maxWidth&&current){lines.push(current);current=word;}else current=test; }
  if(current) lines.push(current); return lines;
}

function roundRect(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

async function loadImage(url){
  if(!url) return null; const img=new Image(); img.crossOrigin='anonymous';
  return await new Promise(resolve=>{ const timer=setTimeout(()=>resolve(null),6000); img.onload=()=>{clearTimeout(timer);resolve(img)}; img.onerror=()=>{clearTimeout(timer);resolve(null)}; img.src=url; });
}

function drawCover(ctx,img,W,H,focal={x:.5,y:.5}){
  const scale=Math.max(W/img.naturalWidth,H/img.naturalHeight);
  const sw=W/scale, sh=H/scale;
  const sx=clamp(img.naturalWidth*focal.x-sw/2,0,img.naturalWidth-sw);
  const sy=clamp(img.naturalHeight*focal.y-sh/2,0,img.naturalHeight-sh);
  ctx.drawImage(img,sx,sy,sw,sh,0,0,W,H);
}

function drawAbstract(ctx,W,H,palette=['#0d1117','#233746','#a68a59']){
  const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,palette[0]); g.addColorStop(.58,palette[1]); g.addColorStop(1,'#070b10'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(W*.72,H*.2,0,W*.72,H*.2,W*.58); glow.addColorStop(0,`${palette[2]}66`); glow.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);
}

function drawAdaptiveScrim(ctx,W,H,placement='center',strength=.36){
  let g;
  if(placement.includes('left')) g=ctx.createLinearGradient(0,0,W,0);
  else if(placement.includes('right')) g=ctx.createLinearGradient(W,0,0,0);
  else if(placement.includes('upper')) g=ctx.createLinearGradient(0,0,0,H);
  else if(placement.includes('lower')) g=ctx.createLinearGradient(0,H,0,0);
  else { g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.68); g.addColorStop(0,`rgba(0,0,0,${strength*.45})`); g.addColorStop(1,`rgba(0,0,0,${Math.min(.7,strength+.24)})`); ctx.fillStyle=g;ctx.fillRect(0,0,W,H);return; }
  g.addColorStop(0,`rgba(0,0,0,${Math.min(.75,strength+.28)})`); g.addColorStop(.58,`rgba(0,0,0,${strength*.45})`); g.addColorStop(1,'rgba(0,0,0,.08)'); ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

function textAnchor(selection,W,H,format){
  const p=selection?.textPlacement || 'center';
  const safeTop=format.safeTop, safeBottom=format.safeBottom;
  const yMin=safeTop+80, yMax=H-safeBottom-160;
  let x=W/2,y=(yMin+yMax)/2,align='center',maxWidth=W*.78;
  if(p.includes('left')){x=W*.12;align='left';maxWidth=W*.68;}
  if(p.includes('right')){x=W*.88;align='right';maxWidth=W*.68;}
  if(p.includes('upper')) y=yMin+120;
  if(p.includes('lower')) y=yMax-100;
  return {x,y,align,maxWidth};
}

export async function generateShareImage(formatName='story'){
  if(!appState.currentVerse) return null;
  const format=SHARE_FORMATS[formatName] || SHARE_FORMATS.story;
  const {width:W,height:H}=format; const verse=appState.currentVerse;
  const sharePurpose = formatName === 'og' ? 'share-landscape' : 'share-portrait';
  let selection;
  let shareIntent = appState.currentVisualIntent;
  try {
    const resolved = await resolveVisualForVerse(verse, { purpose: sharePurpose });
    selection = resolved.visual;
    shareIntent = resolved.intent;
  } catch {
    selection = appState.currentVisual || {
      mode: 'abstract',
      palette: ['#0d1117','#233746','#a68a59'],
      textPlacement: 'center',
      overlayStrength: 0.32
    };
  }
  const canvas=document.createElement('canvas'); canvas.width=W;canvas.height=H; const ctx=canvas.getContext('2d'); ctx.imageSmoothingQuality='high';
  if(document.fonts?.ready) await document.fonts.ready.catch(()=>{});

  if(selection?.mode==='photo'){
    const img=await loadImage(selection.imageUrl);
    const focal = formatName === 'og'
      ? (selection.focalPoint || {x:.5,y:.5})
      : (selection.mobileFocalPoint || selection.focalPoint || {x:.5,y:.5});
    if(img) drawCover(ctx,img,W,H,focal);
    else drawAbstract(ctx,W,H,shareIntent?.photography?.paletteHints);
  } else {
    drawAbstract(ctx,W,H,selection?.palette || shareIntent?.photography?.paletteHints);
  }

  const responsivePlacement = formatName === 'og'
    ? (selection?.textPlacement || 'center')
    : (selection?.mobileTextPlacement || selection?.textPlacement || 'center');

  drawAdaptiveScrim(
    ctx,
    W,
    H,
    responsivePlacement,
    selection?.overlayStrength ?? .36
  );

  ctx.save(); ctx.textAlign='center'; ctx.font=`600 ${Math.round(W*.022)}px Inter, sans-serif`; ctx.letterSpacing=`${Math.round(W*.005)}px`; ctx.fillStyle='rgba(255,255,255,.72)'; ctx.fillText('V E R S  D A Y',W/2,H-format.safeBottom*.34); ctx.restore();

  const anchor=textAnchor(
    { ...selection, textPlacement: responsivePlacement },
    W,
    H,
    format
  );
  const ref=`${getBookName(verse.book)} ${verse.chapter}:${verse.verse}`;
  let fontSize=Math.round(W*(verse.text.length>220?.050:verse.text.length>150?.058:verse.text.length>90?.067:.077));
  ctx.textAlign=anchor.align; ctx.textBaseline='middle';
  let lines=[]; for(let i=0;i<5;i++){ctx.font=`500 ${fontSize}px "Cormorant Garamond", Georgia, serif`;lines=wrapText(ctx,verse.text,anchor.maxWidth);const lineH=fontSize*1.28;if(lines.length*lineH < H*.5) break;fontSize-=6;}
  const lineHeight=fontSize*1.32; const total=lines.length*lineHeight; let startY=anchor.y-total/2+lineHeight/2;
  startY=clamp(startY,format.safeTop+lineHeight,H-format.safeBottom-total+lineHeight/2);

  ctx.save(); ctx.fillStyle='#fffaf2'; ctx.shadowColor='rgba(0,0,0,.72)'; ctx.shadowBlur=Math.round(fontSize*.22); ctx.shadowOffsetY=3; ctx.font=`500 ${fontSize}px "Cormorant Garamond", Georgia, serif`; lines.forEach((line,i)=>ctx.fillText(line,anchor.x,startY+i*lineHeight)); ctx.restore();

  const refY=startY+(lines.length-1)*lineHeight+lineHeight*.95;
  ctx.save(); ctx.textAlign=anchor.align; ctx.font=`600 ${Math.round(fontSize*.42)}px Inter, sans-serif`; const refW=ctx.measureText(ref).width; const padX=Math.round(fontSize*.38),pillH=Math.round(fontSize*.62); let px=anchor.align==='center'?anchor.x-refW/2-padX:anchor.align==='left'?anchor.x-padX:anchor.x-refW-padX; roundRect(ctx,px,refY-pillH/2,refW+padX*2,pillH,pillH/2); ctx.fillStyle='rgba(8,12,18,.64)';ctx.fill();ctx.strokeStyle='rgba(228,179,99,.75)';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#e7bd78';ctx.fillText(ref,anchor.x,refY+1);ctx.restore();

  return canvas.toDataURL('image/png');
}

function showToast(msg){
  let t=document.getElementById('vd-toast'); if(!t){t=document.createElement('div');t.id='vd-toast';t.style.cssText='position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(16px);background:rgba(16,22,32,.96);color:#ECE8E0;padding:13px 26px;border-radius:100px;font:500 .88rem/1 Inter,sans-serif;border:1px solid rgba(228,179,99,.35);box-shadow:0 8px 32px rgba(0,0,0,.45);z-index:9999;opacity:0;transition:.22s;pointer-events:none;white-space:nowrap;max-width:90vw;text-align:center';document.body.appendChild(t);} t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._tid);t._tid=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(16px)'},3000);
}
async function blobFromDataUrl(dataUrl){return (await fetch(dataUrl)).blob();}
function forceDownload(dataUrl,filename){const a=document.createElement('a');a.href=dataUrl;a.download=filename;document.body.appendChild(a);a.click();a.remove();}

export async function shareWhatsApp(){
  showToast('⏳ Gerando composição...'); const dataUrl=await generateShareImage('feed'); if(!dataUrl){showToast('❌ Não foi possível gerar.');return;} const blob=await blobFromDataUrl(dataUrl);const file=new File([blob],'versday-feed.png',{type:'image/png'});
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'VersDay',text:`${appState.currentVerse.text} — ${getBookName(appState.currentVerse.book)} ${appState.currentVerse.chapter}:${appState.currentVerse.verse}`});return;}catch(e){if(e.name==='AbortError')return;}}
  forceDownload(dataUrl,'versday-feed.png');showToast('📥 Imagem salva!');
}

export async function shareInstagram(){
  showToast('✨ Gerando Story 9:16...');const dataUrl=await generateShareImage('story');if(!dataUrl){showToast('❌ Não foi possível gerar.');return;}forceDownload(dataUrl,'versday-story.png');showToast('📸 Story salvo!');
}

export function copyVerseText(){
  if(!appState.currentVerse)return;const v=appState.currentVerse;const text=`"${v.text}" — ${getBookName(v.book)} ${v.chapter}:${v.verse} (ARA)`;navigator.clipboard?.writeText(text).then(()=>showToast('📋 Versículo copiado!')).catch(()=>{const el=document.createElement('textarea');el.value=text;document.body.appendChild(el);el.select();document.execCommand('copy');el.remove();showToast('📋 Versículo copiado!');});
}