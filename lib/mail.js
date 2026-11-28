import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';
import { roomById, formatVnd } from './rooms.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatStay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return String(value || '');
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function lobbyAttachment() {
  try {
    return [{
      filename: 'lobby.jpg',
      content: readFileSync(new URL('../public/lobby.jpg', import.meta.url)),
      cid: 'lobby',
    }];
  } catch {
    return [];
  }
}

function stayRows(booking, room) {
  return [
    ['Guest', booking.guestName],
    ['Email', booking.email],
    ['Phone', booking.phone],
    ['Room', room?.name || booking.roomId],
    ['Check-in', formatStay(booking.checkIn)],
    ['Check-out', formatStay(booking.checkOut)],
    ['Amount', `${formatVnd(booking.amount)} VND`],
    ['Invoice', booking.invoice],
  ];
}

function letter({ title, intro, rows, note, withPhoto }) {
  const detailRows = rows.map(([label, value]) => `
            <tr>
              <td width="108" valign="top" style="width:108px;padding:12px 16px 12px 0;border-bottom:1px solid #E7DCC8;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B7355;">${escapeHtml(label)}</td>
              <td valign="top" style="padding:12px 0;border-bottom:1px solid #E7DCC8;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.45;color:${label === 'Amount' ? '#724B03' : '#1A1A1A'};">${escapeHtml(value)}</td>
            </tr>`).join('');
  const photo = withPhoto ? `
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img src="cid:lobby" width="600" alt="The lobby of Thong Dong Quán" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td bgcolor="#C4973B" style="background:#C4973B;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>` : '';
  const noteRow = note ? `
          <tr>
            <td style="padding:18px 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#5D4E37;">${escapeHtml(note)}</td>
          </tr>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#EFE6D6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EFE6D6;">${escapeHtml(intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#EFE6D6" style="background:#EFE6D6;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#FFFEF9" style="width:100%;max-width:600px;background:#FFFEF9;border:1px solid #E4D7C3;">
          ${photo}
          <tr>
            <td style="padding:32px 28px 4px;">
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C4973B;">Thong Dong Quán</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.25;font-weight:normal;color:#1A1A1A;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 6px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#5D4E37;">${escapeHtml(intro)}</td>
          </tr>
          <tr>
            <td style="padding:10px 28px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>
            </td>
          </tr>
          ${noteRow}
          <tr>
            <td style="padding:22px 28px 32px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:#8B7355;">
              Thong Dong Quán Boutique<br>
              Huế<br>
              <span style="font-family:Arial,Helvetica,sans-serif;">0916134599</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function bookingMessage(booking, audience) {
  const room = roomById(booking.roomId);
  const rows = stayRows(booking, room);
  const attachments = lobbyAttachment();
  const guest = audience === 'guest';
  const title = guest ? 'Payment received' : 'New website booking';
  const intro = guest
    ? `Dear ${booking.guestName}, thank you for booking Thong Dong Quán. We have received your payment and will confirm your stay shortly.`
    : 'A guest paid on the Thong Dong Quán website.';
  const note = guest ? '' : 'Add this stay to the channel manager so other sites stay in sync.';
  const lines = [
    'Thong Dong Quán',
    title,
    '',
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ];
  if (note) lines.push('', note);
  lines.push('', 'Thong Dong Quán Boutique', 'Huế', '0916134599');
  const text = lines.join('\n');
  return {
    subject: guest ? `Your booking at Thong Dong Quán ${booking.invoice}` : `New website booking ${booking.invoice}`,
    text,
    html: letter({ title, intro, rows, note, withPhoto: attachments.length > 0 }),
    attachments,
  };
}

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
}

export async function sendBookingMail(booking) {
  if (!process.env.SMTP_HOST) {
    return { sent: false, reason: 'Set SMTP_HOST to send booking email.' };
  }
  const mailer = transport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const errors = [];
  let sent = false;
  const deliver = async (audience, to) => {
    const message = bookingMessage(booking, audience);
    try {
      await mailer.sendMail({
        from,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      });
      sent = true;
    } catch (error) {
      errors.push(error);
    }
  };
  if (process.env.STAFF_EMAIL) await deliver('staff', process.env.STAFF_EMAIL);
  if (booking.email) await deliver('guest', booking.email);
  if (errors.length) throw errors[0];
  return { sent };
}
