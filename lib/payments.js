import { updateStore } from './store.js';

export async function markDirectPaid(invoice) {
  let booking = null;
  let alreadyPaid = false;
  await updateStore((store) => {
    const found = store.bookings[invoice];
    if (!found) return store;
    booking = { ...found };
    if (found.status === 'paid') {
      alreadyPaid = true;
      return store;
    }
    found.status = 'paid';
    found.paidAt = new Date().toISOString();
    booking = { ...found };
    return store;
  });
  return { booking, alreadyPaid };
}
