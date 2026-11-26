import { FormEvent, useEffect, useState } from 'react';
import '../App.css';
import { formatVnd, roomById } from '../../lib/rooms.js';

type BookingRoom = { roomId: string; units: number };

type ListedBooking = {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  channel?: string;
  source?: string;
  roomId: string;
  rooms?: BookingRoom[];
  checkIn: string;
  checkOut: string;
  amount: number;
  status: string;
  channelUpdated?: boolean;
};

type Session = {
  signedIn: boolean;
  lastImportAt?: string | null;
  channelCount?: number;
  bookings?: ListedBooking[];
  direct?: ListedBooking[];
};

function formatStayDate(value: string) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function roomLines(booking: ListedBooking) {
  const lines = (booking.rooms || []).flatMap((room) => Array.from({ length: room.units || 1 }, () => roomById(room.roomId)?.name || room.roomId));
  return lines.length ? lines : [roomById(booking.roomId)?.name || booking.roomId || ''];
}

const PAGE_SIZE = 10;

function pageWindow<T>(items: T[], page: number) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * PAGE_SIZE;
  return { current, pages, rows: items.slice(start, start + PAGE_SIZE) };
}

function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(total, page * PAGE_SIZE);
  return (
    <div className="pager">
      <span>{start}–{end} of {total}</span>
      <button className="pager-button" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button className="pager-button" type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<Session>({ signedIn: false });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingPage, setBookingPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);

  async function refresh() {
    const response = await fetch('/api/admin/session', { credentials: 'include' });
    const body = await response.json();
    setSession(body);
  }

  useEffect(() => {
    refresh().catch(() => setError('The admin service is not reachable.'));
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not sign in.');
      setPassword('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setSession({ signedIn: false });
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const input = event.currentTarget.elements.namedItem('sheet') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    bytes.forEach((value) => {
      binary += String.fromCharCode(value);
    });
    setLoading(true);
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data: btoa(binary) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not import the file.');
      setMessage(`Matched ${body.imported} booking references. ${body.added} new, ${body.updated} updated. ${body.released} cancelled, so those rooms are available again.`);
      input.value = '';
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import the file.');
    } finally {
      setLoading(false);
    }
  }

  async function markUpdated(id: string) {
    await fetch('/api/admin/channel-updated', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  const bookings = session.bookings || [];
  const payments = (session.direct || []).filter((booking) => booking.status === 'paid');
  const bookingView = pageWindow(bookings, bookingPage);
  const paymentView = pageWindow(payments, paymentPage);

  return (
    <div className="desk">
      <header className="desk-bar">
        <a href="https://www.thongdongquan.com">Thong Dong Quán</a>
        <span>Admin</span>
      </header>
      <main className="desk-main">
        {!session.signedIn ? (
          <section className="desk-card desk-narrow">
            <h1>Staff sign in</h1>
            <form className="desk-form" onSubmit={login}>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <button className="desk-button" type="submit" disabled={loading}>Sign in</button>
            </form>
            {error && <p className="desk-error">{error}</p>}
          </section>
        ) : (
          <>
            <section className="desk-card">
              <div className="desk-title">
                <h1>Channel manager import</h1>
                <button className="desk-text" type="button" onClick={logout}>Sign out</button>
              </div>
              <p>Upload the reservation spreadsheet. Each row is matched by its booking reference. Confirmed and completed stays take the rooms. A cancelled reference gives those rooms back. Website bookings are kept.</p>
              <p>{session.lastImportAt ? `Last upload: ${new Date(session.lastImportAt).toLocaleString()}` : 'No spreadsheet uploaded yet.'} {session.channelCount || 0} channel rows stored.</p>
              <form className="desk-form" onSubmit={upload}>
                <label>Spreadsheet<input name="sheet" type="file" accept=".xls,.xlsx,.csv" required /></label>
                <button className="desk-button" type="submit" disabled={loading}>Update bookings</button>
              </form>
              {message && <p className="desk-note">{message}</p>}
              {error && <p className="desk-error">{error}</p>}
            </section>
            <section className="desk-card">
              <h2>Bookings</h2>
              {bookings.length === 0 ? <p>No bookings stored yet. Upload the channel-manager spreadsheet.</p> : (
                <>
                  <div className="booking-scroll">
                    <table className="booking-list">
                      <thead>
                        <tr>
                          <th>Reference #</th>
                          <th>Guest Name</th>
                          <th>Source</th>
                          <th>Item</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingView.rows.map((booking) => (
                          <tr key={booking.id}>
                            <td className="ref">{booking.id}</td>
                            <td className="guest">{booking.guestName}</td>
                            <td><span className="source-pill">{booking.channel || (booking.source === 'direct' ? 'Website' : 'Channel')}</span></td>
                            <td className="item-lines">{roomLines(booking).map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</td>
                            <td className="date">{formatStayDate(booking.checkIn)}</td>
                            <td className="date">{formatStayDate(booking.checkOut)}</td>
                            <td className="amount">₫ {formatVnd(booking.amount)}</td>
                            <td><span className={`status-pill is-${booking.status}`}>{booking.status}</span></td>
                            <td className="action">
                              {booking.source === 'direct' && booking.status === 'paid' && !booking.channelUpdated && (
                                <button className="booking-action" type="button" onClick={() => markUpdated(booking.id)}>Mark as entered</button>
                              )}
                              {booking.source === 'direct' && booking.channelUpdated && <span className="status-pill is-paid">Entered</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pager page={bookingView.current} pages={bookingView.pages} total={bookings.length} onPage={setBookingPage} />
                </>
              )}
            </section>
            <section className="desk-card">
              <h2>Website payments to enter in the channel manager</h2>
              {payments.length === 0 ? <p>No paid website bookings yet.</p> : (
                <>
                  <div className="desk-table">
                    {paymentView.rows.map((booking) => (
                      <article key={booking.id}>
                        <strong>{booking.guestName}</strong>
                        <span>{booking.roomId} · {booking.checkIn} → {booking.checkOut}</span>
                        <span>{booking.phone} · {booking.email}</span>
                        <span>{formatVnd(booking.amount)} VND</span>
                        {booking.channelUpdated ? <em>Entered</em> : <button className="desk-text" type="button" onClick={() => markUpdated(booking.id)}>Mark as entered</button>}
                      </article>
                    ))}
                  </div>
                  <Pager page={paymentView.current} pages={paymentView.pages} total={payments.length} onPage={setPaymentPage} />
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
