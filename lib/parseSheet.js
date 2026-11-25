import * as XLSX from 'xlsx';
import { mapRoomName } from './rooms.js';
import { toIsoDate } from './dates.js';

function cellText(value) {
  return String(value ?? '').replace(/\r/g, '').trim();
}

function money(value) {
  const digits = cellText(value).replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function rowAmount(row, columns) {
  if (columns && columns.amount != null) return money(row[columns.amount]);
  const grouped = row.map(cellText).filter((text) => /\d{1,3}(?:\.\d{3})+/.test(text));
  if (!grouped.length) return 0;
  return Math.max(...grouped.map(money));
}

function normalizeStatus(value) {
  const text = cellText(value).toLowerCase();
  if (!text) return null;
  if (/cancel|hủy|huy/.test(text)) return 'cancelled';
  if (/complete|hoàn thành|hoan thanh|checked.?out/.test(text)) return 'completed';
  if (/operational|đang phục vụ|dang phuc vu|in[- ]house|checked.?in/.test(text)) return 'operational';
  if (/confirm|xác nhận|xac nhan/.test(text)) return 'confirmed';
  return null;
}

function codeFrom(value) {
  const match = cellText(value).match(/[A-Z]{2,}(?=[A-Z0-9]*\d)[A-Z0-9]{8,}/i);
  return match ? match[0].toUpperCase() : '';
}

function roomUnits(value) {
  const lines = cellText(value).split(/[\n,]/).map((line) => line.trim()).filter(Boolean);
  const counts = new Map();
  for (const line of lines) {
    const id = mapRoomName(line);
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts.entries()].map(([id, units]) => ({ id, units }));
}

function headerMap(row) {
  if (row.some((cell) => codeFrom(cell))) return null;
  const map = {};
  row.forEach((cell, index) => {
    const text = cellText(cell).toLowerCase();
    if (!text) return;
    if (/trạng thái|trang thai|^status$/.test(text)) map.status = index;
    else if (/nhận phòng|nhan phong|check.?in|arrival/.test(text)) map.checkIn = index;
    else if (/trả phòng|tra phong|check.?out|departure/.test(text)) map.checkOut = index;
    else if (/^item$|hạng phòng|hang phong|room type/.test(text)) map.room = index;
    else if (/^source$|kênh|kenh|^channel$/.test(text)) map.channel = index;
    else if (/guest name|tên khách|ten khach|^guest$|customer/.test(text)) map.guest = index;
    else if (/^reference\b|mã đặt|ma dat|booking id/.test(text) && !/ota/.test(text)) map.code = index;
    else if (/booking value|thành tiền|thanh tien|^amount$|^price$|^tổng$|^tong$/.test(text)) map.amount = index;
  });
  return map.status != null && map.room != null && map.code != null ? map : null;
}

function datesIn(row) {
  return row.map(toIsoDate).filter(Boolean);
}

function rowToBookings(row, columns) {
  const code = codeFrom(columns ? row[columns.code] : row.find((cell) => codeFrom(cell)));
  const status = normalizeStatus(columns ? row[columns.status] : row.map(normalizeStatus).find(Boolean));
  const roomCell = columns ? row[columns.room] : row.find((cell) => roomUnits(cell).length);
  const units = roomUnits(roomCell);
  const foundDates = columns
    ? [toIsoDate(row[columns.checkIn]), toIsoDate(row[columns.checkOut])].filter(Boolean)
    : datesIn(row);
  const checkIn = foundDates.length >= 2 ? foundDates[foundDates.length - 2] : foundDates[0];
  const checkOut = foundDates.length >= 2 ? foundDates[foundDates.length - 1] : null;
  if (!code || !status || !units.length || !checkIn || !checkOut || checkOut <= checkIn) return [];

  const guestName = cellText(columns ? row[columns.guest] : row[1]).split('\n')[0];
  const channel = cellText(columns ? row[columns.channel] : row.find((cell) => /booking|expedia|agoda|airbnb|traveloka/i.test(cellText(cell)))).split('\n')[0];
  const amount = rowAmount(row, columns);

  return units.map((unit) => ({
    code,
    guestName,
    channel: channel || 'Channel',
    roomId: unit.id,
    units: unit.units,
    checkIn,
    checkOut,
    status,
    amount,
  }));
}

export function parseChannelSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  let columns = null;
  const bookings = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.every((cell) => !cellText(cell))) continue;
    if (!columns) {
      columns = headerMap(row);
      if (columns) continue;
    }
    bookings.push(...rowToBookings(row, columns));
  }
  return bookings;
}
