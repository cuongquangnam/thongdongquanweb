import { readSession, requireAdmin } from '../../lib/auth.js';
import { sendJson } from '../../lib/http.js';
import { adminSnapshot } from '../../lib/db.js';
import { ROOMS } from '../../lib/rooms.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!readSession(req)) return sendJson(res, 200, { signedIn: false });
  if (!requireAdmin(req, res)) return undefined;
  let snapshot;
  try {
    snapshot = await adminSnapshot();
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message });
  }
  return sendJson(res, 200, {
    signedIn: true,
    rooms: ROOMS.map((room) => ({ id: room.id, name: room.name })),
    ...snapshot,
  });
}
