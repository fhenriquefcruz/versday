// Análise visual leve no navegador: composição, luminância, complexidade e safe areas.
// Não tenta "entender" teologia pela imagem; isso permanece na camada semântica.

const REGION_NAMES = [
  ['upper-left','upper','upper-right'],
  ['left','center','right'],
  ['lower-left','lower','lower-right']
];

function clamp(n,min=0,max=1){return Math.max(min,Math.min(max,n));}

async function loadBitmap(url, timeoutMs=3500){
  if(!url || typeof Image==='undefined') return null;
  return await new Promise(resolve=>{
    const img=new Image(); img.crossOrigin='anonymous'; let done=false;
    const finish=v=>{if(!done){done=true;clearTimeout(timer);resolve(v)}};
    const timer=setTimeout(()=>finish(null),timeoutMs);
    img.onload=()=>finish(img.naturalWidth?img:null); img.onerror=()=>finish(null); img.src=url;
  });
}

function regionStats(gray,w,h,x0,y0,x1,y1){
  let sum=0,sumSq=0,edges=0,n=0;
  for(let y=y0;y<y1;y++){
    for(let x=x0;x<x1;x++){
      const i=y*w+x, v=gray[i]; sum+=v;sumSq+=v*v;n++;
      if(x+1<x1 && Math.abs(v-gray[i+1])>24) edges++;
      if(y+1<y1 && Math.abs(v-gray[i+w])>24) edges++;
    }
  }
  const mean=n?sum/n:0, variance=n?Math.max(0,sumSq/n-mean*mean):0;
  return {mean:mean/255,variance:Math.sqrt(variance)/128,edgeDensity:edges/Math.max(1,n*2)};
}

export async function analyzeCandidateVisual(candidate){
  if(typeof document==='undefined') return candidate;
  const img=await loadBitmap(candidate.previewUrl || candidate.imageUrl);
  if(!img) return candidate;
  const W=96,H=64, canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  try{ctx.drawImage(img,0,0,W,H);}catch{return candidate;}
  let data;try{data=ctx.getImageData(0,0,W,H).data;}catch{return candidate;}
  const gray=new Float32Array(W*H);let total=0;
  for(let i=0,p=0;i<data.length;i+=4,p++){
    const g=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;gray[p]=g;total+=g;
  }
  const avg=total/(W*H*255);
  const regions=[];let saliency={score:-1,x:.5,y:.5};
  for(let ry=0;ry<3;ry++) for(let rx=0;rx<3;rx++){
    const x0=Math.floor(rx*W/3),x1=Math.floor((rx+1)*W/3),y0=Math.floor(ry*H/3),y1=Math.floor((ry+1)*H/3);
    const s=regionStats(gray,W,H,x0,y0,x1,y1);const complexity=clamp(s.variance*.58+s.edgeDensity*2.1);
    const safe=1-complexity;
    regions.push({name:REGION_NAMES[ry][rx],safe,complexity,luminance:s.mean});
    const sal=s.variance*.45+s.edgeDensity*2.4;if(sal>saliency.score){saliency={score:sal,x:(rx+.5)/3,y:(ry+.5)/3};}
  }
  regions.sort((a,b)=>b.safe-a.safe);
  const safeAreas=regions.filter(r=>r.safe>=.58).slice(0,4).map(r=>r.name);
  const bestSafe=regions[0]?.safe || .5;
  const globalContrast=regions.reduce((s,r)=>s+r.complexity,0)/regions.length;
  const compositionScore=clamp(.55+bestSafe*.3+(safeAreas.length?0.08:0)-Math.max(0,globalContrast-.75)*.15);
  return {
    ...candidate,
    width:candidate.width || img.naturalWidth,
    height:candidate.height || img.naturalHeight,
    safeTextAreas:safeAreas.length ? safeAreas : (candidate.safeTextAreas || ['center']),
    focalPoint:candidate.focalPoint || {x:saliency.x,y:saliency.y},
    compositionScore: typeof candidate.compositionScore==='number'
      ? clamp(candidate.compositionScore*.45 + compositionScore*.55)
      : compositionScore,
    technicalAnalysis:{averageLuminance:avg,complexity:globalContrast,bestSafeArea:regions[0]?.name || 'center',bestSafeScore:bestSafe}
  };
}

export async function analyzeShortlist(candidates, limit=5){
  const out=[];
  for(const candidate of candidates.slice(0,limit)) out.push(await analyzeCandidateVisual(candidate));
  return out;
}
