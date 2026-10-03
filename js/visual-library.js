// Acervo curado de segurança do VersDay.
// Imagens conhecidas e deliberadamente classificadas; nunca são usadas por simples aleatoriedade.

const pexels = (id, path, meta) => ({
  id: `pexels-${id}`,
  provider: 'pexels-curated',
  providerName: 'Pexels',
  providerPage: 'https://www.pexels.com/',
  imageUrl: `https://images.pexels.com/photos/${id}/${path}?auto=compress&cs=tinysrgb&w=2000`,
  previewUrl: `https://images.pexels.com/photos/${id}/${path}?auto=compress&cs=tinysrgb&w=900`,
  width: 2000,
  height: 1333,
  qualityScore: 0.9,
  hasEmbeddedText: false,
  hasWatermark: false,
  isAdvertising: false,
  curated: true,
  ...meta
});

export const CURATED_VISUAL_LIBRARY = [
  pexels('457881','pexels-photo-457881.jpeg', {
    themes:['paz','descanso'], tags:['water','lake','stillness','reflection','nature'], moods:['sereno','silencioso','contemplativo'],
    representation:['literal','conceptual'], safeAreas:['center','upper-left'], focalPoint:{x:0.5,y:0.48}, compositionScore:0.91
  }),
  pexels('115141','pexels-photo-115141.jpeg', {
    themes:['pastor'], tags:['sheep','pasture','meadow','flock'], moods:['pastoral','sereno','protetor'],
    representation:['literal'], safeAreas:['upper-right','center'], focalPoint:{x:0.52,y:0.56}, compositionScore:0.9
  }),
  pexels('41953','road-curve-asphalt-country-road-41953.jpeg', {
    themes:['caminho','confianca'], tags:['road','path','journey','landscape'], moods:['progressivo','reflexivo','sereno'],
    representation:['literal','hybrid'], safeAreas:['upper-left','upper-right'], focalPoint:{x:0.5,y:0.58}, compositionScore:0.9
  }),
  pexels('1292115','pexels-photo-1292115.jpeg', {
    themes:['luz','oracao','fe'], tags:['light','shadow','window','interior'], moods:['contemplativo','silencioso','esperançoso'],
    representation:['hybrid','conceptual'], safeAreas:['left','lower-left'], focalPoint:{x:0.62,y:0.46}, compositionScore:0.9
  }),
  pexels('158163','clouds-cloudy-aggregation-nubes-158163.jpeg', {
    themes:['ceu','esperanca'], tags:['sky','clouds','vastness'], moods:['amplo','contemplativo','esperançoso'],
    representation:['literal','hybrid'], safeAreas:['center','lower-left'], focalPoint:{x:0.5,y:0.38}, compositionScore:0.88
  }),
  pexels('1112048','pexels-photo-1112048.jpeg', {
    themes:['agua','paz'], tags:['water','river','nature','flow'], moods:['fluido','sereno','contemplativo'],
    representation:['literal'], safeAreas:['upper-left','upper-right'], focalPoint:{x:0.5,y:0.55}, compositionScore:0.87
  }),
  pexels('844124','pexels-photo-844124.jpeg', {
    themes:['natureza','cura'], tags:['nature','forest','organic','green'], moods:['orgânico','renovador','contemplativo'],
    representation:['literal','conceptual'], safeAreas:['center','upper-right'], focalPoint:{x:0.5,y:0.5}, compositionScore:0.86
  }),
  pexels('1191710','forest-mist-morning-nature-1191710.jpeg', {
    themes:['conforto','descanso','oracao'], tags:['forest','mist','quiet','nature'], moods:['silencioso','acolhedor','contemplativo'],
    representation:['conceptual'], safeAreas:['center','lower-left'], focalPoint:{x:0.5,y:0.48}, compositionScore:0.88
  }),
  pexels('618848','pexels-photo-618848.jpeg', {
    themes:['forca','coragem'], tags:['rock','waves','weather','nature'], moods:['firme','resiliente','dramático-contido'],
    representation:['conceptual','hybrid'], safeAreas:['upper-left','upper-right'], focalPoint:{x:0.55,y:0.58}, compositionScore:0.84
  }),
  pexels('1493215','pexels-photo-1493215.jpeg', {
    themes:['esperanca','cura'], tags:['growth','nature','light','renewal'], moods:['esperançoso','renovador','sereno'],
    representation:['conceptual','hybrid'], safeAreas:['upper-left','right'], focalPoint:{x:0.52,y:0.55}, compositionScore:0.84
  }),
  pexels('344886','pexels-photo-344886.jpeg', {
    themes:['cura','renovacao'], tags:['organic','nature','renewal','soft light'], moods:['gentil','renovador','silencioso'],
    representation:['conceptual'], safeAreas:['left','upper-left'], focalPoint:{x:0.58,y:0.52}, compositionScore:0.83
  }),
  pexels('417074','pexels-photo-417074.jpeg', {
    themes:['coragem','confianca'], tags:['landscape','vastness','weather','journey'], moods:['firme','resiliente','contemplativo'],
    representation:['conceptual','hybrid'], safeAreas:['upper-left','upper-right'], focalPoint:{x:0.5,y:0.5}, compositionScore:0.82
  })
];

function overlap(listA=[], listB=[]) {
  const b = new Set(listB.map(x=>String(x).toLowerCase()));
  return listA.reduce((n,x)=>n + (b.has(String(x).toLowerCase()) ? 1 : 0),0);
}

export function getCuratedCandidates(intent, limit=12) {
  const theme = intent?.semantic?.primaryTheme;
  const literal = intent?.representation?.literalElements || [];
  const moods = intent?.photography?.mood || [];
  const mode = intent?.representation?.mode;

  return CURATED_VISUAL_LIBRARY
    .map(asset => {
      const relevanceHint =
        (asset.themes.includes(theme) ? 5 : 0) +
        overlap(asset.tags, literal) * 3 +
        overlap(asset.moods, moods) * 1.25 +
        (asset.representation.includes(mode) ? 1.5 : 0);
      return { ...asset, relevanceHint };
    })
    .filter(asset => asset.relevanceHint >= 4.5)
    .sort((a,b) => b.relevanceHint - a.relevanceHint)
    .slice(0,limit);
}
