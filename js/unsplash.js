// js/unsplash.js
// Busca imagens contextualizadas (conceituais) no Unsplash, de acordo
// com o tema do versículo atual, em vez de uma busca genérica fixa de
// paisagem que resultava sempre no mesmo tipo de foto (mar/floresta).

const UNSPLASH_ACCESS_KEY = 'gALfSfesmcyut7ux2jYBicr4IDhSK2tzx5xOfuim7O0';
const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';

// Guarda as últimas imagens usadas para evitar repetição próxima
const recentImageUrls = [];
const RECENT_LIMIT = 6;

function rememberImage(url) {
  recentImageUrls.push(url);
  if (recentImageUrls.length > RECENT_LIMIT) recentImageUrls.shift();
}

export async function fetchContextualImage(query) {
  const searchQuery = query || 'nature contemplative light';
  const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(searchQuery)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const imageUrl = data.urls.regular;

    // Evita repetir uma das últimas imagens usadas (tenta de novo 1x)
    if (recentImageUrls.includes(imageUrl)) {
      const retryResponse = await fetch(url);
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        rememberImage(retryData.urls.regular);
        return buildResult(retryData);
      }
    }

    rememberImage(imageUrl);
    return buildResult(data);
  } catch (error) {
    console.error('Erro ao buscar imagem do Unsplash:', error);
    return null;
  }
}

function buildResult(data) {
  const imageUrl = data.urls.regular;
  const photographer = data.user.name;
  const photographerLink = data.user.links.html;
  const unsplashLink = 'https://unsplash.com';

  const attribution = {
    html: `
        <span>📷 Foto de 
            <a href="${photographerLink}?utm_source=VersDay&utm_medium=referral" target="_blank" rel="noopener noreferrer">
                ${photographer}
            </a> 
            no 
            <a href="${unsplashLink}?utm_source=VersDay&utm_medium=referral" target="_blank" rel="noopener noreferrer">
                Unsplash
            </a>
        </span>
    `,
    photographer,
    photographerLink
  };

  return { imageUrl, attribution };
}

// Imagens de fallback locais, organizadas por tema, para quando a API
// falhar (mantém a contextualização mesmo offline).
const FALLBACK_BY_THEME = {
  paz:        ['https://images.pexels.com/photos/457881/pexels-photo-457881.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  alegria:    ['https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  amor:       ['https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  fe:         ['https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  forca:      ['https://images.pexels.com/photos/618848/pexels-photo-618848.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  esperanca:  ['https://images.pexels.com/photos/1493215/pexels-photo-1493215.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  confianca:  ['https://images.pexels.com/photos/2193382/pexels-photo-2193382.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  gratidao:   ['https://images.pexels.com/photos/274062/pexels-photo-274062.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  sabedoria:  ['https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  conforto:   ['https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  coragem:    ['https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  superacao:  ['https://images.pexels.com/photos/1167355/pexels-photo-1167355.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  cura:       ['https://images.pexels.com/photos/344886/pexels-photo-344886.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  perdao:     ['https://images.pexels.com/photos/3533156/pexels-photo-3533156.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  oracao:     ['https://images.pexels.com/photos/912364/pexels-photo-912364.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  descanso:   ['https://images.pexels.com/photos/443446/pexels-photo-443446.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  pastor:     ['https://images.pexels.com/photos/115141/pexels-photo-115141.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  natureza:   ['https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  agua:       ['https://images.pexels.com/photos/1112048/pexels-photo-1112048.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  ceu:        ['https://images.pexels.com/photos/158163/clouds-cloudy-aggregation-nubes-158163.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  caminho:    ['https://images.pexels.com/photos/41953/road-curve-asphalt-country-road-41953.jpeg?auto=compress&cs=tinysrgb&w=1600'],
  luz:        ['https://images.pexels.com/photos/1292115/pexels-photo-1292115.jpeg?auto=compress&cs=tinysrgb&w=1600']
};

export function getFallbackImage(theme) {
  const pool = FALLBACK_BY_THEME[theme] || FALLBACK_BY_THEME.natureza || FALLBACK_BY_THEME.paz;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
