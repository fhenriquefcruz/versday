// api/_cors.js
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://fhenriquefcruz.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
]);

function configuredOrigins() {
  return String(process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

export function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins()]);

  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  if (origin && !allowed.has(origin)) {
    res.status(403).json({ error:'Origin not allowed' });
    return true;
  }

  return false;
}

export function readJsonBody(req, maxBytes = 32_000) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);

  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw) > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}
