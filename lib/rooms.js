export const ROOMS = [
  { id: 'deluxe', name: 'Deluxe Twin', price: 1100000, image: '/deluxedtwin.jpg', total: 4 },
  { id: 'premier', name: 'Premier Deluxe Double', price: 1500000, image: '/premierdeluxedouble.jpg', total: 2 },
  { id: 'family', name: 'Family Suite', price: 2200000, image: '/familysuite.jpg', total: 2 },
  { id: 'queen', name: 'Queen Royal Suite', price: 2200000, image: '/queensuite.jpg', total: 1 },
  { id: 'king', name: 'King Royal Suite', price: 2500000, image: '/kingsuite.jpg', total: 1 },
];

export function roomById(id) {
  return ROOMS.find((room) => room.id === id) || null;
}

export function mapRoomName(value) {
  const text = String(value || '').toLowerCase();
  if (/\bking\b/.test(text)) return 'king';
  if (/\bqueen\b/.test(text)) return 'queen';
  if (/\bfamily\b/.test(text)) return 'family';
  if (/\bpremiere?\b/.test(text)) return 'premier';
  if (/\bdeluxe\b/.test(text)) return 'deluxe';
  return null;
}

export function defaultInventory() {
  return Object.fromEntries(ROOMS.map((room) => [room.id, room.total]));
}

export function formatVnd(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}
