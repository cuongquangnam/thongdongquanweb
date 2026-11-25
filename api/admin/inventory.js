import { requireAdmin } from '../../lib/auth.js';
import { readJson, sendJson } from '../../lib/http.js';
import { ROOMS } from '../../lib/rooms.js';
import { saveInventory } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!requireAdmin(req, res)) return undefined;
  const body = await readJson(req);
  const inventory = {};
  for (const room of ROOMS) {
    const value = Number(body.inventory?.[room.id]);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return sendJson(res, 400, { error: `Enter a room count from 0 to 100 for ${room.name}.` });
    }
    inventory[room.id] = value;
  }
  await saveInventory(inventory);
  return sendJson(res, 200, { ok: true, inventory });
}
