import { readJson } from '../../lib/http.js';
import { sendBookingMail } from '../../lib/mail.js';
import { paymentSucceeded, readPaymentResult } from '../../lib/ninepay.js';
import { markDirectPaid } from '../../lib/payments.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const body = await readJson(req);
  const result = body.result || req.query?.result;
  const checksum = body.checksum || req.query?.checksum;
  const payload = readPaymentResult(result, checksum);
  if (!payload) return res.status(400).send('invalid checksum');
  if (paymentSucceeded(payload)) {
    const { booking, alreadyPaid } = await markDirectPaid(payload.invoice_no);
    if (booking && !alreadyPaid) {
      try {
        await sendBookingMail(booking);
      } catch (error) {
        console.error('Booking email failed', error);
      }
    }
  }
  return res.status(200).send('ok');
}
