import { passwordOk, sessionCookie, signSession } from '../../lib/auth.js';
import { readJson, sendJson } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!process.env.ADMIN_PASSWORD) {
    return sendJson(res, 500, { error: 'Set ADMIN_PASSWORD in the Vercel project settings.' });
  }
  const body = await readJson(req);
  if (!passwordOk(body.password)) return sendJson(res, 401, { error: 'Incorrect password.' });
  res.setHeader('Set-Cookie', sessionCookie(signSession()));
  return sendJson(res, 200, { ok: true });
}
