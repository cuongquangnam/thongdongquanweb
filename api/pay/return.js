import { cancelPendingBooking } from '../../lib/db.js';
import { requestOrigin } from '../../lib/http.js';
import { sendBookingMail } from '../../lib/mail.js';
import { paymentSucceeded, readPaymentResult } from '../../lib/ninepay.js';
import { markDirectPaid } from '../../lib/payments.js';

async function releaseInvoice(invoice) {
  if (!invoice) return;
  try {
    await cancelPendingBooking(invoice);
  } catch (error) {
    console.error('Could not release cancelled booking', error);
  }
}

async function finish(result, checksum) {
  const payload = readPaymentResult(result, checksum);
  if (!payload) return { status: 'invalid' };
  if (!paymentSucceeded(payload)) {
    await releaseInvoice(payload.invoice_no);
    return { status: 'failed', invoice: payload.invoice_no };
  }
  const { booking, alreadyPaid } = await markDirectPaid(payload.invoice_no);
  if (booking && !alreadyPaid) {
    try {
      await sendBookingMail(booking);
    } catch (error) {
      console.error('Booking email failed', error);
    }
  }
  return { status: booking ? 'paid' : 'unknown', invoice: payload.invoice_no };
}

export default async function handler(req, res) {
  const origin = requestOrigin(req);
  try {
    const outcome = await finish(req.query.result, req.query.checksum);
    res.redirect(`${origin}/book/result?status=${outcome.status}&invoice=${encodeURIComponent(outcome.invoice || '')}`);
  } catch (error) {
    console.error(error);
    res.redirect(`${origin}/book/result?status=invalid`);
  }
}
