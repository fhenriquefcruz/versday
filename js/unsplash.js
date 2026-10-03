// js/unsplash.js
// Compatibilidade temporária.
// A integração client-side foi desativada porque credenciais de provedores
// não devem ser publicadas no JavaScript entregue pelo GitHub Pages.
// O fluxo novo vive em visualProvider.js e exige um proxy seguro.

export async function fetchContextualImage() {
  console.warn('[VersDay] Integração Unsplash client-side desativada por segurança.');
  return null;
}

export function getFallbackImage() {
  return null;
}
