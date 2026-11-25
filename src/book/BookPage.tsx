import { FormEvent, useEffect, useState } from 'react';
import '../App.css';
import { formatVnd } from '../../lib/rooms.js';

type RoomOffer = {
  id: string;
  name: string;
  price: number;
  image: string;
  available: number;
};

type Availability = {
  nights: number;
  rooms: RoomOffer[];
};

function isoDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function BookPage() {
  const params = new URLSearchParams(window.location.search);
  const resultStatus = window.location.pathname.startsWith('/book/result') ? params.get('status') : null;
  const [checkIn, setCheckIn] = useState(isoDaysFromNow(1));
  const [checkOut, setCheckOut] = useState(isoDaysFromNow(2));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAvailability(event?: FormEvent) {
    event?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load availability.');
      setAvailability(body);
      setSelected('');
    } catch (err) {
      setAvailability(null);
      setError(err instanceof Error ? err.message : 'Could not load availability.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resultStatus) loadAvailability();
  }, []);

  async function pay(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn, checkOut, roomId: selected, guestName, email, phone }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not start payment.');
      window.location.href = body.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment.');
      setLoading(false);
    }
  }

  const room = availability?.rooms.find((item) => item.id === selected);
  const amount = room && availability ? room.price * availability.nights : 0;

  return (
    <div className="desk">
      <header className="desk-bar">
        <a href="/">Thong Dong Quán</a>
        <span>Book a room</span>
      </header>
      <main className="desk-main">
        {resultStatus ? (
          <section className="desk-card">
            <h1>{resultStatus === 'paid' ? 'Payment received' : 'Payment was not completed'}</h1>
            <p>
              {resultStatus === 'paid'
                ? 'The hotel has been emailed. We will confirm your stay shortly.'
                : 'No charge was recorded. You can choose the dates again.'}
            </p>
            <a className="desk-button" href="/book">Back to availability</a>
          </section>
        ) : (
          <>
            <section className="desk-card">
              <h1>Available rooms</h1>
              <form className="desk-dates" onSubmit={loadAvailability}>
                <label>Check in<input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required /></label>
                <label>Check out<input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required /></label>
                <button className="desk-button" type="submit" disabled={loading}>Check</button>
              </form>
              {error && <p className="desk-error">{error}</p>}
              <div className="desk-rooms">
                {availability?.rooms.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`desk-room ${selected === item.id ? 'is-selected' : ''}`}
                    disabled={item.available < 1}
                    onClick={() => setSelected(item.id)}
                  >
                    <img src={item.image} alt="" />
                    <span>
                      <strong>{item.name}</strong>
                      <em>{formatVnd(item.price)} VND / night</em>
                      <small>{item.available > 0 ? `${item.available} available` : 'Sold out'}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {room && room.available > 0 && (
              <section className="desk-card">
                <h2>Guest details</h2>
                <p>{room.name} · {availability?.nights} night{availability?.nights === 1 ? '' : 's'} · {formatVnd(amount)} VND</p>
                <form className="desk-form" onSubmit={pay}>
                  <label>Full name<input value={guestName} onChange={(event) => setGuestName(event.target.value)} required /></label>
                  <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                  <label>Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
                  <button className="desk-button" type="submit" disabled={loading}>Continue to payment</button>
                </form>
                <p className="desk-note">You will pay on 9Pay by card, QR, or another method, then return here.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
