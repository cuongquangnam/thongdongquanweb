import { FormEvent, useEffect, useState } from 'react';
import '../App.css';
import { readStoredLanguage, storeLanguage } from '../../lib/language.js';
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

type Language = 'en' | 'vi';

const copy = {
  en: {
    bookARoom: 'Book a room',
    availableRooms: 'Available rooms',
    checkIn: 'Check in',
    checkOut: 'Check out',
    check: 'Check',
    available: (count: number) => `${count} available`,
    soldOut: 'Sold out',
    perNight: 'VND / night',
    guestDetails: 'Guest details',
    nights: (count: number) => `${count} night${count === 1 ? '' : 's'}`,
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    continue: 'Continue to payment',
    payNote: 'You will pay on 9Pay by card, QR, or another method, then return here.',
    loadError: 'Could not load availability.',
    payError: 'Could not start payment.',
    invoice: 'Invoice',
    status: 'Status',
    statusPaid: 'Paid',
    statusCancelled: 'Cancelled',
    statusFailed: 'Failed',
    statusOther: 'Unknown',
    home: 'Return to the hotel site',
    help: 'Need help? Call 0916134599',
    lobbyAlt: 'The lobby of Thong Dong Quán',
    results: {
      paid: {
        title: 'Booking confirmed',
        body: 'Thank you for booking with us. Your payment is complete and your stay is confirmed. A confirmation email with your booking details has been sent to you.',
        action: 'Back to availability',
      },
      cancelled: {
        title: 'Payment cancelled',
        body: 'You left the payment page before finishing. No charge was recorded. You can choose the dates again whenever you are ready.',
        action: 'Choose dates again',
      },
      failed: {
        title: 'Payment was not completed',
        body: 'The payment did not go through. No charge was recorded. You can try again with the same dates.',
        action: 'Try again',
      },
      other: {
        title: 'We could not confirm the payment',
        body: 'The payment result could not be verified. If you were charged, please contact the hotel with your invoice number and we will help.',
        action: 'Back to availability',
      },
    },
  },
  vi: {
    bookARoom: 'Đặt phòng',
    availableRooms: 'Phòng còn trống',
    checkIn: 'Nhận phòng',
    checkOut: 'Trả phòng',
    check: 'Kiểm tra',
    available: (count: number) => `Còn ${count} phòng`,
    soldOut: 'Hết phòng',
    perNight: 'VND / đêm',
    guestDetails: 'Thông tin khách',
    nights: (count: number) => `${count} đêm`,
    fullName: 'Họ và tên',
    email: 'Email',
    phone: 'Điện thoại',
    continue: 'Tiếp tục thanh toán',
    payNote: 'Quý khách sẽ thanh toán trên 9Pay bằng thẻ, QR hoặc phương thức khác, rồi quay lại đây.',
    loadError: 'Không tải được tình trạng phòng.',
    payError: 'Không bắt đầu được thanh toán.',
    invoice: 'Hóa đơn',
    status: 'Trạng thái',
    statusPaid: 'Đã thanh toán',
    statusCancelled: 'Đã hủy',
    statusFailed: 'Không thành công',
    statusOther: 'Chưa xác định',
    home: 'Về trang khách sạn',
    help: 'Cần hỗ trợ? Gọi 0916134599',
    lobbyAlt: 'Sảnh Thong Dong Quán',
    results: {
      paid: {
        title: 'Đặt phòng đã được xác nhận',
        body: 'Cảm ơn quý khách đã đặt phòng. Thanh toán đã hoàn tất và kỳ nghỉ của quý khách đã được xác nhận. Email xác nhận kèm chi tiết đặt phòng đã được gửi đến quý khách.',
        action: 'Quay lại chọn phòng',
      },
      cancelled: {
        title: 'Thanh toán đã hủy',
        body: 'Quý khách đã rời trang thanh toán trước khi hoàn tất. Không phát sinh khoản phí nào. Quý khách có thể chọn lại ngày khi sẵn sàng.',
        action: 'Chọn lại ngày',
      },
      failed: {
        title: 'Thanh toán chưa hoàn tất',
        body: 'Thanh toán không thành công. Không phát sinh khoản phí nào. Quý khách có thể thử lại với cùng ngày.',
        action: 'Thử lại',
      },
      other: {
        title: 'Không xác nhận được thanh toán',
        body: 'Kết quả thanh toán chưa thể xác minh. Nếu quý khách đã bị trừ tiền, vui lòng liên hệ khách sạn kèm số hóa đơn để được hỗ trợ.',
        action: 'Quay lại chọn phòng',
      },
    },
  },
} as const;

function isoDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function resultCopy(status: string | null, language: Language) {
  const texts = copy[language].results;
  if (status === 'paid') return { ...texts.paid, tone: 'paid' as const };
  if (status === 'cancelled') return { ...texts.cancelled, tone: 'missed' as const };
  if (status === 'failed') return { ...texts.failed, tone: 'missed' as const };
  return { ...texts.other, tone: 'missed' as const };
}

export default function BookPage() {
  const params = new URLSearchParams(window.location.search);
  const resultStatus = window.location.pathname.startsWith('/book/result') ? params.get('status') : null;
  const invoice = params.get('invoice') || '';
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage());
  const t = copy[language];
  const result = resultStatus ? resultCopy(resultStatus, language) : null;
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
      if (!response.ok) throw new Error(body.error || t.loadError);
      setAvailability(body);
      setSelected('');
    } catch (err) {
      setAvailability(null);
      setError(err instanceof Error ? err.message : t.loadError);
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
        body: JSON.stringify({ checkIn, checkOut, roomId: selected, guestName, email, phone, language }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || t.payError);
      window.location.href = body.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payError);
      setLoading(false);
    }
  }

  function toggleLanguage() {
    setLanguage(storeLanguage(language === 'en' ? 'vi' : 'en'));
  }

  const room = availability?.rooms.find((item) => item.id === selected);
  const amount = room && availability ? room.price * availability.nights : 0;

  return (
    <div className="desk" lang={language}>
      <header className="desk-bar">
        <a href="/">Thong Dong Quán</a>
        <div className="desk-bar-actions">
          <span>{t.bookARoom}</span>
          <button className="language-toggle desk-language" type="button" onClick={toggleLanguage} aria-label="Toggle language">
            {language === 'en' ? 'VI' : 'EN'}
          </button>
        </div>
      </header>
      <main className="desk-main">
        {result ? (
          <section className={`book-result is-${result.tone}`} aria-live="polite">
            <div className="book-result-media">
              <img src="/lobby.jpg" alt={t.lobbyAlt} />
            </div>
            <div className="book-result-body">
              <p className="book-result-eyebrow">Thong Dong Quán</p>
              <h1>{result.title}</h1>
              <p className="book-result-copy">{result.body}</p>
              {invoice && (
                <dl className="book-result-meta">
                  <div>
                    <dt>{t.invoice}</dt>
                    <dd>{invoice}</dd>
                  </div>
                  <div>
                    <dt>{t.status}</dt>
                    <dd className="status">
                      {resultStatus === 'paid' ? t.statusPaid
                        : resultStatus === 'cancelled' ? t.statusCancelled
                          : resultStatus === 'failed' ? t.statusFailed
                            : t.statusOther}
                    </dd>
                  </div>
                </dl>
              )}
              <div className="book-result-actions">
                <a className="desk-button" href="/book">{result.action}</a>
                <a className="desk-text" href="/">{t.home}</a>
              </div>
              <p className="book-result-contact">{t.help}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="desk-card">
              <h1>{t.availableRooms}</h1>
              <form className="desk-dates" onSubmit={loadAvailability}>
                <label>{t.checkIn}<input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required /></label>
                <label>{t.checkOut}<input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required /></label>
                <button className="desk-button" type="submit" disabled={loading}>{t.check}</button>
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
                      <em>{formatVnd(item.price)} {t.perNight}</em>
                      <small>{item.available > 0 ? t.available(item.available) : t.soldOut}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {room && room.available > 0 && (
              <section className="desk-card">
                <h2>{t.guestDetails}</h2>
                <p>{room.name} · {t.nights(availability?.nights || 0)} · {formatVnd(amount)} VND</p>
                <form className="desk-form" onSubmit={pay}>
                  <label>{t.fullName}<input value={guestName} onChange={(event) => setGuestName(event.target.value)} required /></label>
                  <label>{t.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                  <label>{t.phone}<input value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
                  <button className="desk-button" type="submit" disabled={loading}>{t.continue}</button>
                </form>
                <p className="desk-note">{t.payNote}</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
