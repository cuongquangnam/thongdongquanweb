import { availabilityForStay } from '../lib/db.js';
import { sendJson } from '../lib/http.js';
import { nightsBetween } from '../lib/dates.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed.' });
  const checkIn = String(req.query.checkIn || '');
  const checkOut = String(req.query.checkOut || '');
  const nights = nightsBetween(checkIn, checkOut);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) || nights < 1 || nights > 30) {
    return sendJson(res, 400, { error: 'Choose a stay from 1 to 30 nights.' });
  }
  try {
    return sendJson(res, 200, {
      checkIn,
      checkOut,
      nights,
      rooms: await availabilityForStay(checkIn, checkOut),
    });
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message });
  }
}
