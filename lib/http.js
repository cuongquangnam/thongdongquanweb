export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

export function sendJson(res, status, body) {
  res.status(status).json(body);
}

export function requestOrigin(req) {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(String(host));
  const proto = req.headers['x-forwarded-proto'] || (local ? 'http' : 'https');
  return `${String(proto).split(',')[0].trim()}://${host}`;
}
