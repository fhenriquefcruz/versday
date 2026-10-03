// api/visual-select.js
import { applyCors, readJsonBody } from './_cors.js';

function isAllowedDownloadLocation(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'api.unsplash.com' &&
      /^\/photos\/[^/]+\/download$/.test(url.pathname);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return res.status(503).json({ error:'Image provider not configured' });

  try {
    const body = await readJsonBody(req, 8_000);
    const downloadLocation = String(body.downloadLocation || '');

    if (!isAllowedDownloadLocation(downloadLocation)) {
      return res.status(400).json({ error:'Invalid download location' });
    }

    const response = await fetch(downloadLocation, {
      headers:{
        Authorization:'Client-ID ' + accessKey,
        'Accept-Version':'v1'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error:'Download tracking failed' });
    }

    await response.json().catch(() => ({}));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok:true, tracked:true });
  } catch (error) {
    console.error('[VersDay API] visual-select:', error);
    return res.status(error.message === 'Payload too large' ? 413 : 502)
      .json({ error:'Download tracking failed' });
  }
}
