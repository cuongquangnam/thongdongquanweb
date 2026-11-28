import crypto from 'node:crypto';
import { availabilityForStay, createDirectBooking } from '../lib/db.js';
import { nightsBetween } from '../lib/dates.js';
import { readJson, requestOrigin, sendJson } from '../lib/http.js';
import { normalizeLanguage } from '../lib/language.js';
import { createPaymentUrl, ninepayConfigured } from '../lib/ninepay.js';
import { roomById } from '../lib/rooms.js';

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
  const language = normalizeLanguage(body.language);
  if (!room || nights < 1 || nights > 30) return sendJson(res, 400, { error: 'Choose a room and a valid stay.' });
  if (guestName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 8) {
    return sendJson(res, 400, { error: 'Enter the guest name, email, and phone number.' });
  }

  const amount = room.price * nights;
  const invoice = `TDQ${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`.slice(0, 30).toUpperCase();
  try {
    const available = (await availabilityForStay(checkIn, checkOut)).find((item) => item.id === room.id);
    if (!available || available.available < 1) {
      return sendJson(res, 409, { error: 'That room is no longer available for these dates.' });
    }
    await createDirectBooking({ reference: invoice, guestName, email, phone, checkIn, checkOut, amount, roomId: room.id, language });
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message });
  }

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
