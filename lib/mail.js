import nodemailer from 'nodemailer';
import { roomById, formatVnd } from './rooms.js';

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

function stayLines(booking, room) {
  return [
    `Guest: ${booking.guestName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Room: ${room?.name || booking.roomId}`,
    `Check-in: ${booking.checkIn}`,
    `Check-out: ${booking.checkOut}`,
    `Amount: ${formatVnd(booking.amount)} VND`,
    `Invoice: ${booking.invoice}`,
  ];
}

export async function sendBookingMail(booking) {
  if (!process.env.SMTP_HOST) {
    return { sent: false, reason: 'Set SMTP_HOST to send booking email.' };
  }
  const room = roomById(booking.roomId);
  const mailer = transport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const details = stayLines(booking, room);
  const errors = [];
  let sent = false;
  const deliver = async (message) => {
    try {
      await mailer.sendMail(message);
      sent = true;
    } catch (error) {
      errors.push(error);
    }
  };
  if (process.env.STAFF_EMAIL) {
    await deliver({
      from,
      to: process.env.STAFF_EMAIL,
      subject: `New website booking ${booking.invoice}`,
      text: [
        'A guest paid on the Thong Dong Quán website.',
        'Add this stay to the channel manager so other sites stay in sync.',
        '',
        ...details,
      ].join('\n'),
    });
  }
  if (booking.email) {
    await deliver({
      from,
      to: booking.email,
      subject: `Your booking at Thong Dong Quán ${booking.invoice}`,
      text: [
        `Dear ${booking.guestName},`,
        '',
        'Thank you for booking Thong Dong Quán. We have received your payment.',
        'The hotel will confirm your stay shortly.',
        '',
        ...details,
        '',
        'Thong Dong Quán',
        'Phone: 0916134599',
      ].join('\n'),
    });
  }
  if (errors.length) throw errors[0];
  return { sent };
}
