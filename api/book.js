import crypto from 'node:crypto';
import { availabilityForStay } from '../lib/availability.js';
import { nightsBetween } from '../lib/dates.js';
import { readJson, requestOrigin, sendJson } from '../lib/http.js';
import { createPaymentUrl, ninepayConfigured } from '../lib/ninepay.js';
import { roomById } from '../lib/rooms.js';
import { readStore, updateStore } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!ninepayConfigured()) {
    return sendJson(res, 503, { error: 'Card and QR payment is not switched on yet.' });
  }
  const body = await readJson(req);
  const checkIn = String(body.checkIn || '');
  const checkOut = String(body.checkOut || '');
  const nights = nightsBetween(checkIn, checkOut);
  const room = roomById(body.roomId);
  const guestName = String(body.guestName || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  if (!room || nights < 1 || nights > 30) return sendJson(res, 400, { error: 'Choose a room and a valid stay.' });
  if (guestName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 8) {
    return sendJson(res, 400, { error: 'Enter the guest name, email, and phone number.' });
  }

  const amount = room.price * nights;
  const invoice = `TDQ${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`.slice(0, 30).toUpperCase();
  const store = await readStore();
  const available = availabilityForStay(store, checkIn, checkOut).find((item) => item.id === room.id);
  if (!available || available.available < 1) {
    return sendJson(res, 409, { error: 'That room is no longer available for these dates.' });
  }

  await updateStore((current) => {
    current.bookings[invoice] = {
      reference: invoice,
      source: 'direct',
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      status: 'pending',
      amount,
      rooms: [{ roomId: room.id, units: 1 }],
      channelUpdated: false,
      createdAt: new Date().toISOString(),
    };
    return current;
  });

  const origin = requestOrigin(req);
  const paymentUrl = createPaymentUrl({
    invoiceNo: invoice,
    amount,
    description: `${room.name} ${checkIn} to ${checkOut}`.slice(0, 255),
    returnUrl: `${origin}/api/pay/return`,
    backUrl: `${origin}/book/result?status=cancelled&invoice=${invoice}`,
  });
  return sendJson(res, 200, { paymentUrl, invoice, amount });
}
