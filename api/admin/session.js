import { readSession, requireAdmin } from '../../lib/auth.js';
import { sendJson } from '../../lib/http.js';
import { readStore } from '../../lib/store.js';
import { ROOMS } from '../../lib/rooms.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!readSession(req)) return sendJson(res, 200, { signedIn: false });
  if (!requireAdmin(req, res)) return undefined;
  const store = await readStore();
  const bookings = Object.values(store.bookings);
  return sendJson(res, 200, {
    signedIn: true,
    inventory: store.inventory,
    rooms: ROOMS.map((room) => ({ id: room.id, name: room.name })),
    lastImportAt: store.lastImportAt,
    channelCount: bookings.filter((booking) => booking.source === 'channel').length,
    direct: bookings.filter((booking) => booking.source === 'direct').reverse().map((booking) => ({
      id: booking.reference,
      guestName: booking.guestName,
      email: booking.email,
      phone: booking.phone,
      roomId: booking.rooms?.[0]?.roomId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      amount: booking.amount,
      status: booking.status,
      channelUpdated: booking.channelUpdated,
    })),
  });
}
