import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res, { methods: ['GET', 'OPTIONS'] })) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({
    ok: true,
    service: 'versday-api',
    version: '1',
    region: process.env.VERCEL_REGION || null,
    providers: {
      imagesConfigured: Boolean(process.env.UNSPLASH_ACCESS_KEY),
      chatConfigured: Boolean(process.env.GROQ_API_KEY)
    }
  });
}
