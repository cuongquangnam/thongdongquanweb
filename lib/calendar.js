import { eachNight } from './dates.js';
import { defaultInventory } from './rooms.js';

const HOLD_MS = 30 * 60 * 1000;

export function bookingBlocks(booking, now = Date.now()) {
  if (!booking) return false;
  if (booking.source === 'direct') {
    if (booking.status === 'paid') return true;
    if (booking.status !== 'pending') return false;
    return now - Date.parse(booking.createdAt) < HOLD_MS;
  }
  return booking.status === 'confirmed' || booking.status === 'completed';
}

export function buildCalendar(store, now = Date.now()) {
  const calendar = {};
  for (const booking of Object.values(store.bookings || {})) {
    if (!bookingBlocks(booking, now)) continue;
    for (const night of eachNight(booking.checkIn, booking.checkOut)) {
      for (const room of booking.rooms || []) {
        if (!room.roomId) continue;
        calendar[room.roomId] ||= {};
        const cell = calendar[room.roomId][night] ||= { available: 0, references: [] };
        if (!cell.references.includes(booking.reference)) cell.references.push(booking.reference);
      }
    }
  }
  for (const [roomId, dates] of Object.entries(calendar)) {
    const total = Number(store.inventory?.[roomId] ?? 0);
    for (const cell of Object.values(dates)) {
      const used = cell.references.reduce((sum, reference) => {
        const line = store.bookings[reference]?.rooms?.find((room) => room.roomId === roomId);
        return sum + (line?.units || 0);
      }, 0);
      cell.available = Math.max(0, total - used);
    }
  }
  return calendar;
}

function channelBooking(reference, rows) {
  const first = rows[0];
  return {
    reference,
    source: 'channel',
    guestName: first.guestName || '',
    channel: first.channel || '',
    checkIn: first.checkIn,
    checkOut: first.checkOut,
    status: first.status,
    amount: first.amount || 0,
    rooms: rows.map((row) => ({ roomId: row.roomId, units: row.units || 1 })),
  };
}

function directBooking(row) {
  const reference = row.reference || row.invoice || row.id;
  return {
    reference,
    source: 'direct',
    guestName: row.guestName || '',
    email: row.email || '',
    phone: row.phone || '',
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    status: row.status,
    amount: row.amount || 0,
    rooms: row.rooms || [{ roomId: row.roomId, units: row.units || 1 }],
    channelUpdated: Boolean(row.channelUpdated),
    createdAt: row.createdAt,
    paidAt: row.paidAt,
  };
}

export function normalizeStore(raw, now = Date.now()) {
  const source = raw || {};
  const inventory = { ...defaultInventory(), ...(source.inventory || {}) };
  const bookings = {};
  for (const booking of Object.values(source.bookings || {})) {
    if (!booking?.reference) continue;
    bookings[booking.reference] = booking.source === 'direct' ? directBooking(booking) : { ...booking, source: 'channel' };
  }
  const channelRows = new Map();
  for (const row of source.channel || []) {
    const reference = String(row.code || '').replace(/-\d+$/, '');
    if (!reference || bookings[reference]) continue;
    const rows = channelRows.get(reference) || [];
    rows.push(row);
    channelRows.set(reference, rows);
  }
  for (const [reference, rows] of channelRows) bookings[reference] = channelBooking(reference, rows);
  for (const row of source.direct || []) {
    const reference = row.invoice || row.id;
    if (!reference || bookings[reference]) continue;
    bookings[reference] = directBooking(row);
  }
  const store = { inventory, bookings, lastImportAt: source.lastImportAt || null, calendar: {} };
  store.calendar = buildCalendar(store, now);
  return store;
}
