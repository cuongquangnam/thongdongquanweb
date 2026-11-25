import { FormEvent, useEffect, useState } from 'react';
import '../App.css';
import { formatVnd } from '../../lib/rooms.js';

type DirectBooking = {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: string;
  channelUpdated?: boolean;
};

type Session = {
  signedIn: boolean;
  inventory?: Record<string, number>;
  rooms?: { id: string; name: string }[];
  lastImportAt?: string | null;
  channelCount?: number;
  direct?: DirectBooking[];
};

export default function AdminApp() {
  const [session, setSession] = useState<Session>({ signedIn: false });
  const [password, setPassword] = useState('');
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const response = await fetch('/api/admin/session', { credentials: 'include' });
    const body = await response.json();
    setSession(body);
    setInventory(body.inventory || {});
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

  async function saveInventory(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await fetch('/api/admin/inventory', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Could not save room counts.');
      return;
    }
    setMessage('Room counts saved.');
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
              <h2>Rooms in the hotel</h2>
              <form className="desk-form" onSubmit={saveInventory}>
                {session.rooms?.map((room) => (
                  <label key={room.id}>
                    {room.name}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={inventory[room.id] ?? 0}
                      onChange={(event) => setInventory({ ...inventory, [room.id]: Number(event.target.value) })}
                    />
                  </label>
                ))}
                <button className="desk-button" type="submit">Save counts</button>
              </form>
            </section>
            <section className="desk-card">
              <h2>Website payments to enter in the channel manager</h2>
              <div className="desk-table">
                {(session.direct || []).filter((booking) => booking.status === 'paid').map((booking) => (
                  <article key={booking.id}>
                    <strong>{booking.guestName}</strong>
                    <span>{booking.roomId} · {booking.checkIn} → {booking.checkOut}</span>
                    <span>{booking.phone} · {booking.email}</span>
                    <span>{formatVnd(booking.amount)} VND</span>
                    {booking.channelUpdated ? <em>Entered</em> : <button className="desk-text" type="button" onClick={() => markUpdated(booking.id)}>Mark as entered</button>}
                  </article>
                ))}
                {(session.direct || []).every((booking) => booking.status !== 'paid') && <p>No paid website bookings yet.</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
