import { sendJson } from '../lib/http.js';
import { nightsBetween } from '../lib/dates.js';
import { readStore } from '../lib/store.js';
import { availabilityForStay } from '../lib/availability.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed.' });
  const checkIn = String(req.query.checkIn || '');
  const checkOut = String(req.query.checkOut || '');
  const nights = nightsBetween(checkIn, checkOut);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) || nights < 1 || nights > 30) {
    return sendJson(res, 400, { error: 'Choose a stay from 1 to 30 nights.' });
  }
  const store = await readStore();
  return sendJson(res, 200, {
    checkIn,
    checkOut,
    nights,
    rooms: availabilityForStay(store, checkIn, checkOut),
  });
}
