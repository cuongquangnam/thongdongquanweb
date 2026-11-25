import nodemailer from 'nodemailer';
import { roomById, formatVnd } from './rooms.js';

export async function sendBookingMail(booking) {
  if (!process.env.STAFF_EMAIL || !process.env.SMTP_HOST) {
    return { sent: false, reason: 'Set STAFF_EMAIL and SMTP_HOST to notify the hotel.' };
  }
  const room = roomById(booking.roomId);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.STAFF_EMAIL,
    subject: `New website booking ${booking.invoice}`,
    text: [
      'A guest paid on the Thong Dong Quán website.',
      'Add this stay to the channel manager so other sites stay in sync.',
      '',
      `Guest: ${booking.guestName}`,
      `Email: ${booking.email}`,
      `Phone: ${booking.phone}`,
      `Room: ${room?.name || booking.roomId}`,
      `Check-in: ${booking.checkIn}`,
      `Check-out: ${booking.checkOut}`,
      `Amount: ${formatVnd(booking.amount)} VND`,
      `Invoice: ${booking.invoice}`,
    ].join('\n'),
  });
  return { sent: true };
}
