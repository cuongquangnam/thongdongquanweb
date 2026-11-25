import { requireAdmin } from '../../lib/auth.js';
import { readJson, sendJson } from '../../lib/http.js';
import { markChannelUpdated } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!requireAdmin(req, res)) return undefined;
  const body = await readJson(req);
  await markChannelUpdated(body.id);
  return sendJson(res, 200, { ok: true });
}
