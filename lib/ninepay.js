import crypto from 'node:crypto';

function host() {
  const raw = process.env.NINEPAY_ENDPOINT || 'https://sand-payment.9pay.vn';
  return raw.replace(/\/$/, '').replace(/\/portal$/, '');
}

export function ninepayConfigured() {
  return Boolean(process.env.NINEPAY_MERCHANT_KEY && process.env.NINEPAY_SECRET_KEY && process.env.NINEPAY_CHECKSUM_KEY);
}

function buildHttpQuery(data) {
  const httpQuery = new URLSearchParams();
  for (const key of Object.keys(data).sort()) {
    httpQuery.append(key, data[key]);
  }
  return httpQuery.toString();
}

export function createPaymentUrl({ invoiceNo, amount, description, returnUrl, backUrl }) {
  const time = Math.round(Date.now() / 1000);
  const parameters = {
    merchantKey: process.env.NINEPAY_MERCHANT_KEY,
    time,
    invoice_no: invoiceNo,
    amount,
    description,
    return_url: returnUrl,
    back_url: backUrl,
  };
  const httpQuery = buildHttpQuery(parameters);
  const message = `POST\n${host()}/payments/create\n${time}\n${httpQuery}`;
  const signature = crypto.createHmac('sha256', process.env.NINEPAY_SECRET_KEY).update(message).digest('base64');
  const baseEncode = Buffer.from(JSON.stringify(parameters)).toString('base64');
  return `${host()}/portal?${buildHttpQuery({ baseEncode, signature })}`;
}

export function readPaymentResult(result, checksum) {
  const expected = crypto.createHash('sha256').update(`${result}${process.env.NINEPAY_CHECKSUM_KEY}`).digest('hex');
  const given = Buffer.from(String(checksum || '').toLowerCase());
  const actual = Buffer.from(expected.toLowerCase());
  if (!result || given.length !== actual.length || !crypto.timingSafeEqual(given, actual)) {
    return null;
  }
  return JSON.parse(Buffer.from(result, 'base64').toString('utf8'));
}

export function paymentSucceeded(payload) {
  return Number(payload?.status) === 5;
}
