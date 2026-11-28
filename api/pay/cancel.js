import { cancelPendingBooking } from '../../lib/db.js';
import { readJson, requestOrigin, sendJson } from '../../lib/http.js';

function invoiceFromPath(req) {
  const url = String(req.url || '');
  const match = url.match(/\/api\/pay\/cancel\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]).trim() : '';
}

async function readInvoice(req) {
  const fromQuery = String(req.query?.invoice || req.query?.invoice_no || '').trim();
  if (fromQuery) return fromQuery;
  const fromPath = invoiceFromPath(req);
  if (fromPath) return fromPath;
  if (req.method === 'POST') {
    const body = await readJson(req);
    return String(body.invoice || body.invoice_no || '').trim();
  }
  return '';
}

export default async function handler(req, res) {
  const origin = requestOrigin(req);
  const wantsJson = req.method === 'POST' || String(req.headers.accept || '').includes('application/json');
  let invoice = '';
  let deleted = false;
  try {
    invoice = await readInvoice(req);
    if (invoice) {
      ({ deleted } = await cancelPendingBooking(invoice));
    }
  } catch (error) {
    console.error('Cancel booking failed', error);
    if (wantsJson) {
      return sendJson(res, error.status || 500, { deleted: false, invoice, error: error.message });
    }
  }
  if (wantsJson) {
    return sendJson(res, 200, { deleted, invoice });
  }
  res.redirect(`${origin}/book/result?status=cancelled&invoice=${encodeURIComponent(invoice)}`);
}
