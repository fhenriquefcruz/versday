import { createHash } from 'node:crypto';

const buckets = new Map();
const MAX_BUCKETS = 2_000;

export const RATE_LIMIT_POLICIES = Object.freeze({
  chat: Object.freeze({
    limit: 12,
    windowMs: 60_000
  }),
  visualSearch: Object.freeze({
    limit: 30,
    windowMs: 60_000
  }),
  visualValidate: Object.freeze({
    limit: 8,
    windowMs: 60_000
  }),
  visualSelect: Object.freeze({
    limit: 60,
    windowMs: 60_000
  })
});

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return String(value || '');
}

export function getClientFingerprint(req = {}) {
  const forwarded = normalizeHeaderValue(
    req.headers?.['x-forwarded-for']
  )
    .split(',')[0]
    .trim();

  const realIp = normalizeHeaderValue(
    req.headers?.['x-real-ip']
  ).trim();

  const socketIp = String(
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ''
  ).trim();

  const source = forwarded || realIp || socketIp || 'unknown';

  return createHash('sha256')
    .update(source)
    .digest('hex')
    .slice(0, 24);
}

function pruneBuckets(now) {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size < MAX_BUCKETS) return;

  const overflow = buckets.size - MAX_BUCKETS + 100;
  let removed = 0;

  for (const key of buckets.keys()) {
    buckets.delete(key);
    removed++;
    if (removed >= overflow) break;
  }
}

export function checkRateLimit({
  scope,
  fingerprint,
  limit,
  windowMs,
  now = Date.now()
}) {
  const safeScope = String(scope || 'default')
    .trim()
    .slice(0, 80);
  const safeFingerprint = String(
    fingerprint || 'unknown'
  ).slice(0, 80);
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 1, 10_000)
  );
  const safeWindow = Math.max(
    1_000,
    Math.min(Number(windowMs) || 60_000, 86_400_000)
  );

  pruneBuckets(now);

  const key = `${safeScope}:${safeFingerprint}`;
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt: now + safeWindow
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(
    0,
    safeLimit - bucket.count
  );
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000)
  );

  return {
    allowed: bucket.count <= safeLimit,
    limit: safeLimit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds
  };
}

export function applyRateLimit(
  req,
  res,
  scope,
  policy = {}
) {
  if (req.method === 'OPTIONS') return false;

  const result = checkRateLimit({
    scope,
    fingerprint: getClientFingerprint(req),
    limit: policy.limit,
    windowMs: policy.windowMs
  });

  res.setHeader(
    'RateLimit-Limit',
    String(result.limit)
  );
  res.setHeader(
    'RateLimit-Remaining',
    String(result.remaining)
  );
  res.setHeader(
    'RateLimit-Reset',
    String(Math.ceil(result.resetAt / 1000))
  );

  if (result.allowed) return false;

  res.setHeader(
    'Retry-After',
    String(result.retryAfterSeconds)
  );

  res.status(429).json({
    error: 'Too many requests',
    retryAfterSeconds: result.retryAfterSeconds
  });

  return true;
}

export function resetRateLimitState() {
  buckets.clear();
}
