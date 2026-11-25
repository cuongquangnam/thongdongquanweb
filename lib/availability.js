import { eachNight } from './dates.js';
import { buildCalendar } from './calendar.js';
import { ROOMS } from './rooms.js';

export function availabilityForStay(store, checkIn, checkOut, now = Date.now()) {
  const nights = eachNight(checkIn, checkOut);
  const calendar = buildCalendar(store, now);
  return ROOMS.map((room) => {
    const total = Number(store.inventory?.[room.id] ?? room.total);
    let left = total;
    for (const night of nights) {
      const cell = calendar[room.id]?.[night];
      left = Math.min(left, cell ? cell.available : total);
    }
    return {
      id: room.id,
      name: room.name,
      price: room.price,
      image: room.image,
      total,
      available: left,
    };
  });
}
