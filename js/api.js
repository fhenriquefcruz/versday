export const API_URL = 'https://bible-api.com/data/ara/random';
export const TIMEOUT_MS = 4000;

export async function fetchVerseFromAPI() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return {
      text: data.text,
      reference: data.reference,
      book: data.book_id,
      chapter: data.chapter,
      verse: data.verse
    };
  } catch (e) {
    clearTimeout(timeoutId);
    return null;
  }
}
