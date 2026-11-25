import crypto from 'node:crypto';

const COOKIE = 'tdq_admin';

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function passwordOk(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || !input) return false;
  const given = Buffer.from(String(input));
  const actual = Buffer.from(expected);
  if (given.length !== actual.length) return false;
  return crypto.timingSafeEqual(given, actual);
}

export function signSession() {
  const body = Buffer.from(JSON.stringify({
    exp: Date.now() + 12 * 60 * 60 * 1000,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readSession(req) {
  if (!secret()) return false;
  const header = req.headers.cookie || '';
  const part = header.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE}=`));
  if (!part) return false;
  const token = decodeURIComponent(part.slice(COOKIE.length + 1));
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const given = Buffer.from(sig);
  const actual = Buffer.from(expected);
  if (given.length !== actual.length || !crypto.timingSafeEqual(given, actual)) return false;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

function cookie(value, maxAge) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function sessionCookie(token) {
  return cookie(token, 12 * 60 * 60);
}

export function clearSessionCookie() {
  return cookie('', 0);
}

export function requireAdmin(req, res) {
  if (readSession(req)) return true;
  res.status(401).json({ error: 'Sign in required.' });
  return false;
}
