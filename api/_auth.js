import crypto from 'node:crypto';

// Shared admin auth. Same-origin only (no CORS headers are sent), constant-time compare,
// a short delay on every failure, and a per-instance lockout after repeated failures.
// The panel refuses to work at all if ADMIN_PASSWORD is shorter than 16 characters.
const fails = new Map(); // ip -> { n, until }
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function checkAuth(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const f = fails.get(ip);
  if (f && f.until > now) { res.status(429).json({ error: 'Too many attempts. Try again later.' }); return false; }

  const secret = process.env.ADMIN_PASSWORD || '';
  if (secret.length < 16) { res.status(503).json({ error: 'Admin is disabled until a strong password is set.' }); return false; }

  const given = (req.headers.authorization || '').replace(/^Bearer /, '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(secret).digest();
  if (given && crypto.timingSafeEqual(a, b)) { fails.delete(ip); return true; }

  const n = (f ? f.n : 0) + 1;
  fails.set(ip, { n, until: n >= 5 ? now + 15 * 60 * 1000 : 0 });
  await sleep(1000);
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

export const ALLOWED = ['articles'];
export const REPO = 'yusuf15emre-hue/yeni7';
