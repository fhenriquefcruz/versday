// js/visualCatalog.js
// Acervo curado de segurança do VersDay.
// Não é a fonte principal: entra apenas quando a coerência é forte.
// Quando não houver encaixe, o motor prefere composição abstrata.

function pexels(id, path, meta) {
  return {
    id:'pexels-' + id,
    provider:'Pexels',
    providerUrl:'https://www.pexels.com/',
    imageUrl:'https://images.pexels.com/photos/' + id + '/' + path + '?auto=compress&cs=tinysrgb&w=2000',
    previewUrl:'https://images.pexels.com/photos/' + id + '/' + path + '?auto=compress&cs=tinysrgb&w=900',
    width:2000,
    height:1333,
    qualityScore:0.9,
    identityScore:0.9,
    hasEmbeddedText:false,
    hasWatermark:false,
    isAdvertising:false,
    nsfw:false,
    curated:true,
    ...meta
  };
}

export const CURATED_VISUALS = [
  pexels('457881','pexels-photo-457881.jpeg', {
    tags:['paz','descanso','água','water','lake','stillness','reflection','nature'],
    moods:['sereno','silencioso','contemplativo','quieto'],
    representationModes:['literal','conceptual'],
    safeTextAreas:['center','upper-left'],
    focalPoint:{x:0.5,y:0.48},
    mobileFocalPoint:{x:0.5,y:0.5},
    compositionScore:0.91,
    negativeTags:['festa','multidão','guerra']
  }),
  pexels('115141','pexels-photo-115141.jpeg', {
    tags:['pastoreio','pastor','ovelhas','pastagem','sheep','pasture','meadow','flock','cuidado'],
    moods:['pastoral','sereno','protetor','quieto'],
    representationModes:['literal','hybrid'],
    safeTextAreas:['upper-right','center'],
    focalPoint:{x:0.52,y:0.56},
    mobileFocalPoint:{x:0.5,y:0.54},
    compositionScore:0.9,
    negativeTags:['cidade','festa','guerra']
  }),
  pexels('41953','road-curve-asphalt-country-road-41953.jpeg', {
    tags:['caminho','confiança','estrada','direção','jornada','path','road','trail','journey'],
    moods:['progressivo','reflexivo','sereno','contemplativo'],
    representationModes:['literal','hybrid','conceptual'],
    safeTextAreas:['upper-left','upper-right'],
    focalPoint:{x:0.5,y:0.58},
    mobileFocalPoint:{x:0.5,y:0.56},
    compositionScore:0.9,
    negativeTags:['festa','multidão']
  }),
  pexels('1292115','pexels-photo-1292115.jpeg', {
    tags:['luz','oração','fé','light','shadow','window','interior'],
    moods:['contemplativo','silencioso','esperançoso','íntimo'],
    representationModes:['hybrid','conceptual'],
    safeTextAreas:['left','lower-left'],
    focalPoint:{x:0.62,y:0.46},
    mobileFocalPoint:{x:0.6,y:0.48},
    compositionScore:0.9,
    negativeTags:['festa','publicidade']
  }),
  pexels('158163','clouds-cloudy-aggregation-nubes-158163.jpeg', {
    tags:['céu','esperança','sky','clouds','vastness','amplitude','adversidade'],
    moods:['amplo','contemplativo','esperançoso','solene'],
    representationModes:['literal','hybrid'],
    safeTextAreas:['center','lower-left'],
    focalPoint:{x:0.5,y:0.38},
    mobileFocalPoint:{x:0.5,y:0.42},
    compositionScore:0.88,
    negativeTags:['íntimo','festa']
  }),
  pexels('1112048','pexels-photo-1112048.jpeg', {
    tags:['água','paz','water','river','flow','nature'],
    moods:['fluido','sereno','contemplativo'],
    representationModes:['literal','hybrid'],
    safeTextAreas:['upper-left','upper-right'],
    focalPoint:{x:0.5,y:0.55},
    mobileFocalPoint:{x:0.5,y:0.54},
    compositionScore:0.87,
    negativeTags:['resort','festa']
  }),
  pexels('844124','pexels-photo-844124.jpeg', {
    tags:['criação','cura','natureza','nature','forest','organic','green'],
    moods:['orgânico','renovador','contemplativo','delicado'],
    representationModes:['literal','conceptual'],
    safeTextAreas:['center','upper-right'],
    focalPoint:{x:0.5,y:0.5},
    mobileFocalPoint:{x:0.5,y:0.5},
    compositionScore:0.86,
    negativeTags:['cidade','festa']
  }),
  pexels('1191710','forest-mist-morning-nature-1191710.jpeg', {
    tags:['conforto','descanso','oração','forest','mist','quiet','nature','solitude'],
    moods:['silencioso','acolhedor','contemplativo','quieto'],
    representationModes:['conceptual','hybrid'],
    safeTextAreas:['center','lower-left'],
    focalPoint:{x:0.5,y:0.48},
    mobileFocalPoint:{x:0.5,y:0.48},
    compositionScore:0.88,
    negativeTags:['alegria','festa','multidão']
  }),
  pexels('618848','pexels-photo-618848.jpeg', {
    tags:['força','coragem','adversidade','rock','waves','weather','nature'],
    moods:['firme','resiliente','dramático','sóbrio'],
    representationModes:['conceptual','hybrid'],
    safeTextAreas:['upper-left','upper-right'],
    focalPoint:{x:0.55,y:0.58},
    mobileFocalPoint:{x:0.54,y:0.56},
    compositionScore:0.84,
    negativeTags:['festa','acolhedor']
  }),
  pexels('1493215','pexels-photo-1493215.jpeg', {
    tags:['esperança','cura','growth','nature','light','renewal'],
    moods:['esperançoso','renovador','sereno'],
    representationModes:['conceptual','hybrid'],
    safeTextAreas:['upper-left','right'],
    focalPoint:{x:0.52,y:0.55},
    mobileFocalPoint:{x:0.52,y:0.53},
    compositionScore:0.84,
    negativeTags:['festa','multidão']
  }),
  pexels('344886','pexels-photo-344886.jpeg', {
    tags:['cura','renovação','organic','nature','renewal','soft light'],
    moods:['delicado','renovador','silencioso'],
    representationModes:['conceptual'],
    safeTextAreas:['left','upper-left'],
    focalPoint:{x:0.58,y:0.52},
    mobileFocalPoint:{x:0.56,y:0.5},
    compositionScore:0.83,
    negativeTags:['festa','publicidade']
  }),
  pexels('417074','pexels-photo-417074.jpeg', {
    tags:['coragem','confiança','landscape','vastness','weather','journey','adversidade'],
    moods:['firme','resiliente','contemplativo'],
    representationModes:['conceptual','hybrid'],
    safeTextAreas:['upper-left','upper-right'],
    focalPoint:{x:0.5,y:0.5},
    mobileFocalPoint:{x:0.5,y:0.5},
    compositionScore:0.82,
    negativeTags:['festa','multidão']
  })
];

export function getCuratedCandidates() {
  return CURATED_VISUALS.map(item => ({
    ...item,
    tags:[...item.tags],
    moods:[...item.moods],
    safeTextAreas:[...item.safeTextAreas],
    negativeTags:[...item.negativeTags]
  }));
}
