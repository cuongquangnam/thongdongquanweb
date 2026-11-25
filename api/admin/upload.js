import { requireAdmin } from '../../lib/auth.js';
import { readJson, sendJson } from '../../lib/http.js';
import { parseChannelSheet } from '../../lib/parseSheet.js';
import { saveChannelBookings } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!requireAdmin(req, res)) return undefined;
  const body = await readJson(req);
  if (!body.data) return sendJson(res, 400, { error: 'Choose the spreadsheet downloaded from the channel manager.' });
  const buffer = Buffer.from(body.data, 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    return sendJson(res, 400, { error: 'The file must be under 5 MB.' });
  }
  let channel;
  try {
    channel = parseChannelSheet(buffer);
  } catch {
    return sendJson(res, 400, { error: 'That file could not be read. Upload the .xls or .xlsx export.' });
  }
  if (!channel.length) {
    return sendJson(res, 400, { error: 'No bookings were found. Upload the reservation export from the channel manager.' });
  }
  const incoming = new Map();
  for (const booking of channel) {
    const rows = incoming.get(booking.code) || [];
    rows.push(booking);
    incoming.set(booking.code, rows);
  }
  let saved;
  try {
    saved = await saveChannelBookings(incoming);
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message });
  }
  const { added, updated, lastImportAt } = saved;
  const released = channel.filter((booking) => booking.status === 'cancelled').length;
  return sendJson(res, 200, {
    ok: true,
    imported: incoming.size,
    added,
    updated,
    released,
    lastImportAt,
  });
}
