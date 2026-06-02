// js/unsplash.js
// Serviço para buscar imagens de paisagem no Unsplash

const UNSPLASH_ACCESS_KEY = 'gALfSfesmcyut7ux2jYBicr4IDhSK2tzx5xOfuim7O0';
const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';

// Cache da última imagem para evitar repetição muito rápida
let lastImageUrl = '';

export async function fetchLandscapeImage() {
    // Busca paisagens variadas
    const query = 'landscape nature mountain forest lake ocean sky clouds stars';
    const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const imageUrl = data.urls.regular;
        
        // Evita repetir a mesma imagem duas vezes seguidas (básico)
        if (imageUrl === lastImageUrl) {
            return fetchLandscapeImage(); // tenta novamente
        }
        lastImageUrl = imageUrl;

        // Dados para atribuição obrigatória
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
    } catch (error) {
        console.error('Erro ao buscar imagem do Unsplash:', error);
        return null;
    }
}

// Imagem de fallback local (caso a API falhe)
export function getFallbackImage() {
    // Lista de imagens locais (paisagens garantidas)
    const fallbacks = [
        'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600',
        'https://images.pexels.com/photos/618848/pexels-photo-618848.jpeg?auto=compress&cs=tinysrgb&w=1600',
        'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1600'
    ];
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    return fallbacks[randomIndex];
}
