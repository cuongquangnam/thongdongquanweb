import { requireAdmin } from '../../lib/auth.js';
import { readJson, sendJson } from '../../lib/http.js';
import { parseChannelSheet } from '../../lib/parseSheet.js';
import { updateStore } from '../../lib/store.js';

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
  let added = 0;
  let updated = 0;
  const store = await updateStore((current) => {
    const bookings = { ...current.bookings };
    for (const [reference, rows] of incoming) {
      const first = rows[0];
      if (bookings[reference]?.source === 'channel') updated += 1;
      else added += 1;
      bookings[reference] = {
        reference,
        source: 'channel',
        guestName: first.guestName || '',
        channel: first.channel || '',
        checkIn: first.checkIn,
        checkOut: first.checkOut,
        status: first.status,
        amount: first.amount || 0,
        rooms: rows.map((row) => ({ roomId: row.roomId, units: row.units || 1 })),
      };
    }
    return { ...current, bookings, lastImportAt: new Date().toISOString() };
  });
  const released = channel.filter((booking) => booking.status === 'cancelled').length;
  return sendJson(res, 200, {
    ok: true,
    imported: incoming.size,
    added,
    updated,
    released,
    lastImportAt: store.lastImportAt,
  });
}
