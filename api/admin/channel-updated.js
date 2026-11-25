import { requireAdmin } from '../../lib/auth.js';
import { readJson, sendJson } from '../../lib/http.js';
import { updateStore } from '../../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!requireAdmin(req, res)) return undefined;
  const body = await readJson(req);
  await updateStore((store) => {
    const booking = store.bookings[body.id];
    if (booking) booking.channelUpdated = true;
    return store;
  });
  return sendJson(res, 200, { ok: true });
}
