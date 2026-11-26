import { createClient } from '@supabase/supabase-js';
import { eachNight } from './dates.js';
import { ROOMS, defaultInventory } from './rooms.js';

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const error = new Error('Connect Supabase with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    error.status = 503;
    throw error;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function fail(error) {
  if (!error) return;
  const wrapped = new Error(error.message || 'Could not reach the booking database.');
  wrapped.status = 503;
  throw wrapped;
}

const HOLD_MS = 30 * 60 * 1000;

function bookingBlocks(booking, now) {
  if (booking.source === 'direct') {
    if (booking.status === 'paid') return true;
    if (booking.status !== 'pending') return false;
    return now - Date.parse(booking.created_at) < HOLD_MS;
  }
  return booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'operational';
}

export async function getInventory() {
  const db = client();
  const { data, error } = await db.from('inventory').select('room_id, total');
  fail(error);
  if (!data.length) {
    const seed = Object.entries(defaultInventory()).map(([room_id, total]) => ({ room_id, total }));
    fail((await db.from('inventory').insert(seed)).error);
    return defaultInventory();
  }
  return Object.fromEntries(data.map((row) => [row.room_id, row.total]));
}

export async function availabilityForStay(checkIn, checkOut) {
  const db = client();
  const now = Date.now();
  const inventory = await getInventory();
  const { data, error } = await db
    .from('bookings')
    .select('source, status, check_in, check_out, created_at, booking_rooms(room_id, units)')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn);
  fail(error);
  const blocking = (data || []).filter((booking) => bookingBlocks(booking, now));
  const nights = eachNight(checkIn, checkOut);
  return ROOMS.map((room) => {
    const total = Number(inventory[room.id] ?? room.total);
    let left = total;
    for (const night of nights) {
      const used = blocking.reduce((sum, booking) => {
        if (booking.check_in > night || night >= booking.check_out) return sum;
        const line = booking.booking_rooms?.find((item) => item.room_id === room.id);
        return sum + (line?.units || 0);
      }, 0);
      left = Math.min(left, Math.max(0, total - used));
    }
    return { id: room.id, name: room.name, price: room.price, image: room.image, total, available: left };
  });
}

export async function saveChannelBookings(incoming) {
  const db = client();
  const references = [...incoming.keys()];
  const { data: existing, error } = await db.from('bookings').select('reference, source').in('reference', references);
  fail(error);
  const known = new Map(existing.map((row) => [row.reference, row.source]));
  let added = 0;
  let updated = 0;
  const bookingRows = [];
  const roomRows = [];
  for (const [reference, rows] of incoming) {
    if (known.get(reference) === 'direct') continue;
    if (known.get(reference) === 'channel') updated += 1;
    else added += 1;
    const first = rows[0];
    bookingRows.push({
      reference,
      source: 'channel',
      guest_name: first.guestName || '',
      channel: first.channel || '',
      check_in: first.checkIn,
      check_out: first.checkOut,
      status: first.status,
      amount: first.amount || 0,
    });
    for (const row of rows) roomRows.push({ reference, room_id: row.roomId, units: row.units || 1 });
  }
  if (bookingRows.length) {
    fail((await db.from('bookings').upsert(bookingRows, { onConflict: 'reference' })).error);
    fail((await db.from('booking_rooms').delete().in('reference', bookingRows.map((row) => row.reference))).error);
    fail((await db.from('booking_rooms').insert(roomRows)).error);
  }
  const lastImportAt = new Date().toISOString();
  fail((await db.from('settings').upsert({ key: 'last_import_at', value: lastImportAt })).error);
  return { added, updated, lastImportAt };
}

export async function createDirectBooking(booking) {
  const db = client();
  fail((await db.from('bookings').insert({
    reference: booking.reference,
    source: 'direct',
    guest_name: booking.guestName,
    email: booking.email,
    phone: booking.phone,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    status: 'pending',
    amount: booking.amount,
    channel_updated: false,
    created_at: new Date().toISOString(),
  })).error);
  fail((await db.from('booking_rooms').insert({
    reference: booking.reference,
    room_id: booking.roomId,
    units: 1,
  })).error);
}

export async function markDirectPaid(invoice) {
  const db = client();
  const { data, error } = await db
    .from('bookings')
    .select('*, booking_rooms(room_id, units)')
    .eq('reference', invoice)
    .maybeSingle();
  fail(error);
  if (!data) return { booking: null, alreadyPaid: false };
  const booking = {
    invoice: data.reference,
    guestName: data.guest_name,
    email: data.email,
    phone: data.phone,
    roomId: data.booking_rooms?.[0]?.room_id,
    checkIn: data.check_in,
    checkOut: data.check_out,
    amount: data.amount,
    status: data.status,
  };
  if (data.status === 'paid') return { booking, alreadyPaid: true };
  fail((await db.from('bookings').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('reference', invoice)).error);
  return { booking: { ...booking, status: 'paid' }, alreadyPaid: false };
}

export async function markChannelUpdated(reference) {
  const db = client();
  fail((await db.from('bookings').update({ channel_updated: true }).eq('reference', reference)).error);
}

export async function saveInventory(inventory) {
  const db = client();
  const rows = Object.entries(inventory).map(([room_id, total]) => ({ room_id, total }));
  fail((await db.from('inventory').upsert(rows, { onConflict: 'room_id' })).error);
}

export async function adminSnapshot() {
  const db = client();
  const inventory = await getInventory();
  const [{ count, error: channelError }, { data: direct, error: directError }, { data: bookings, error: bookingsError }, { data: setting, error: settingError }] = await Promise.all([
    db.from('bookings').select('reference', { count: 'exact', head: true }).eq('source', 'channel'),
    db.from('bookings').select('*, booking_rooms(room_id, units)').eq('source', 'direct').order('created_at', { ascending: false }),
    db.from('bookings').select('reference, guest_name, email, phone, channel, source, check_in, check_out, status, amount, channel_updated, booking_rooms(room_id, units)').order('check_in', { ascending: false }),
    db.from('settings').select('value').eq('key', 'last_import_at').maybeSingle(),
  ]);
  fail(channelError || directError || bookingsError || settingError);
  const listed = (rows) => (rows || []).map((row) => ({
    id: row.reference,
    guestName: row.guest_name,
    email: row.email || '',
    phone: row.phone || '',
    channel: row.channel || (row.source === 'direct' ? 'Website' : ''),
    source: row.source,
    checkIn: row.check_in,
    checkOut: row.check_out,
    amount: row.amount,
    status: row.status,
    channelUpdated: row.channel_updated,
    rooms: (row.booking_rooms || []).map((room) => ({ roomId: room.room_id, units: room.units })),
    roomId: row.booking_rooms?.[0]?.room_id,
  }));
  return {
    inventory,
    lastImportAt: setting?.value || null,
    channelCount: count || 0,
    bookings: listed(bookings),
    direct: listed(direct),
  };
}
