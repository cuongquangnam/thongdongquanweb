const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const named = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (named) {
    const month = MONTHS[named[2].slice(0, 3).toLowerCase()];
    if (month) {
      return `${named[3]}-${String(month).padStart(2, '0')}-${String(named[1]).padStart(2, '0')}`;
    }
  }
  const dmy = text.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  return null;
}

export function nightsBetween(checkIn, checkOut) {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86400000);
}

export function eachNight(checkIn, checkOut) {
  const count = nightsBetween(checkIn, checkOut);
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const nights = [];
  for (let i = 0; i < count; i += 1) {
    nights.push(new Date(start + i * 86400000).toISOString().slice(0, 10));
  }
  return nights;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
