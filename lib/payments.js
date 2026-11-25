import { markDirectPaid as markPaidInDatabase } from './db.js';

export function markDirectPaid(invoice) {
  return markPaidInDatabase(invoice);
}
