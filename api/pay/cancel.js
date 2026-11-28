import { cancelPendingBooking } from '../../lib/db.js';
import { requestOrigin } from '../../lib/http.js';

export default async function handler(req, res) {
  const origin = requestOrigin(req);
  const invoice = String(req.query?.invoice || '').trim();
  try {
    if (invoice) await cancelPendingBooking(invoice);
  } catch (error) {
    console.error(error);
  }
  res.redirect(`${origin}/book/result?status=cancelled&invoice=${encodeURIComponent(invoice)}`);
}
