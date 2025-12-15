import { useState, useEffect } from 'react';
import './App.css';

// TypeScript: define interfaces for Room, Testimonial, Image Data
interface Room {
  name: string;
  price: string;
  badge: string | null;
}

interface Testimonial {
  name: string;
  avatar: string;
  text: string;
}

interface Images {
  heroBanner: string;
  storyPhotos: string[];
  experiencePhoto: string;
  gallery: string[];
  avatars: { baoNguyen: string; nhiTran: string; thanhThao: string };
  logo: string;
  rooms: string[];
  facilities: string[];
}

const IMAGES: Images = {
  heroBanner: '/public/mainbanner.jpg',
  storyPhotos: [
    // 'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762331491/crop-file.webp',
    // 'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762095580/crop-file.webp',
    // 'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762331528/crop-file.webp',
    '/public/legacy_tandung.jpg',
    '/public/legacy_emperor_1.jpg',
    '/public/legacy_consulate.jpg',
  ],
  experiencePhoto:
    'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1761935461/gioi-thieu-thong-dong-quan-boutique.webp',
  gallery: [
    '/public/gallery1.webp',
    '/public/gallery2.webp',
    '/public/gallery3.webp',
    '/public/gallery4.webp',
    '/public/gallery5.webp',
    '/public/gallery6.webp',
  ],
  avatars: {
    baoNguyen:
      'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762247259/crop-file.webp',
    nhiTran:
      'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762247638/crop-file.webp',
    thanhThao:
      'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762267857/crop-file.webp',
  },
  logo:
    'https://cdn.kiotvietweb.vn/merchant/0d44f8017f8985c6901bc9ddcf80f1ea/cropped/1762267239/crop-file.webp',
  rooms: [
    '/public/deluxedtwin.jpg',
    '/public/premierdeluxedouble.jpg',
    '/public/familysuite.jpg',
    '/public/queensuite.jpg',
    '/public/kingsuite.jpg',
  ],
  facilities: [
    '/public/facility-breakfast.jpg',
    '/public/facility-rooms.jpg',
    '/public/facility-location.jpg',
  ]
};

const ROOMS: Room[] = [
  { name: 'Deluxe Twin', price: '1.100.000', badge: 'Popular' },
  { name: 'Premier Deluxe Double', price: '1.500.000', badge: 'Best Value' },
  { name: 'Family Suite', price: '2.200.000', badge: null },
  { name: 'Queen Royal Suite', price: '2.200.000', badge: 'Premium' },
  { name: 'King Royal Suite', price: '2.500.000', badge: 'Signature' },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Bao Nguyen',
    avatar: IMAGES.avatars.baoNguyen,
    text:
      
"I stayed at Thong Dong Boutique Hotel during my visit to Hue, and it was honestly one of the most relaxing places I've ever stayed. The hotel has such a calm, welcoming vibe — beautifully designed with local touches and so much attention to detail.",
  },
  {
    name: 'Nhi Tran',
    avatar: IMAGES.avatars.nhiTran,
    text:
      "I planned a solo trip to Hue to take a break from my busy life, and I wanted to stay somewhere close to the city center but still quiet and cozy. Thong Dong Boutique turned out to be the perfect choice.",
  },
  {
    name: 'Thanh Thao Pham',
    avatar: IMAGES.avatars.thanhThao,
    text:
      'Located right in the Western Quarter, the central location is convenient for traveling to all the "must visit, must try" places when coming to Hue. The hotel is new so you can rest assured about the facilities!',
  },
];

// Translations
const translations = {
  en: {
    nav: {
      story: 'Our Story',
      experience: 'Experience',
      rooms: 'Rooms',
      gallery: 'Gallery',
      guests: 'Guests',
      contact: 'Contact',
      bookNow: 'Book Now',
    },
    hero: {
      tagline: 'An Elegant Stay in the Heart of Huế',
      discover: 'Discover',
      reserve: 'Reserve Your Stay',
    },
    story: {
      label: 'Our Story',
      title: 'From Legacy to\nNew Beginnings',
      text1: 'From a family with more than 30 years in the hospitality industry in Huế, we once made our mark with',
      text2: 'That achievement is not only a source of pride but also the foundation for us to begin a new chapter:',
      quote: '"Where every moment slows down, becoming serene, graceful, and full of emotion."',
    },
    experience: {
      label: 'The Experience',
      title: 'An Elegant Stay\nin the Heart of Huế',
      text1: 'Thong Dong Quán was created for those who cherish elegance – from business travelers and curious explorers to anyone seeking peace of mind. Inspired by the timeless beauty of the ancient capital and the art of slow living, this place gathers the essence of refined service, deep understanding of guests, and subtle touches of creativity in every corner.',
      text2: 'Located at a prime spot in Huế - Phố Tây (vibrant Western District), and just a short stroll from the romantic Perfume River, Thong Dong Quán offers a warm, intimate stay with a neighbourhood full of choices for food and entertainment.',
    },
    facilities: {
      label: 'Amenities',
      title: 'Facilities & Services',
      intro: "Located in Huế's vibrant Night Walking Street (Phố Tây), Thong Dong Quán Boutique Hotel is surrounded by history, culture, and the rhythm of local life. Just a short stroll leads you to the Perfume River, cafés, lined with artisan shops.",
      items: {
        breakfast: {
          title: 'Vegetarian Breakfast included',
          desc: '',
        },
        rooms: {
          title: 'Spacious Rooms',
          title2: '32–61m²',
          desc: '',
        },
        location: {
          title: "Located in",
          title2: 'Night Walking Street',
          title3: '(Phố Tây)',
          desc: '',
        },
      },
    },
    needs: {
      title: 'All You Need',
      intro: 'Everything you need for a comfortable and effortless stay — from modern essentials to the thoughtful details that make you feel like home.',
      items: {
        bistro: {
          title: 'Bistro & Café',
          desc: 'Serving signature Huế-inspired dishes and specialty coffee in a serene, elegant setting',
        },
        comfort: {
          title: 'Elegant Comfort',
          desc: 'Spacious rooms (32–61m²) with high-quality bedding, private balconies, and abundant natural light',
        },
        peace: {
          title: 'Peace of Mind',
          desc: 'Enjoy 24/7 security, complimentary Wi-Fi, laundry services, and on-site parking for a seamless stay',
        },
        premium: {
          title: 'Premium Touches',
          desc: 'Indulge in refined bath amenities and thoughtful details that elevate your everyday comfort',
        },
      },
    },
    rooms: {
      label: 'Accommodations',
      title: 'Room Types',
      intro: 'We provide many room types with high quality, catering to your diverse needs.',
      perNight: '/night',
      bookNow: 'Book Now',
    },
    gallery: {
      quote: 'We extend this invitation to you – so that when you come to Huế, you may find a second home here, where every moment slows down, becoming serene, graceful, and full of emotion.',
    },
    testimonials: {
      title: 'Feedback from Customers',
    },
    contact: {
      title: 'Thong Dong Quán Boutique',
      connect: 'Connect',
      branch: 'Branch system',
      facebook: 'Facebook Page',
    },
    footer: {
      copyright: '© 2025 Thong Dong Quán Boutique. All rights reserved.',
      powered: 'Product developed by KiotVietWeb',
    },
  },
  vi: {
    nav: {
      story: 'Câu Chuyện',
      experience: 'Trải Nghiệm',
      rooms: 'Phòng',
      gallery: 'Thư Viện Ảnh',
      guests: 'Khách Hàng',
      contact: 'Liên Hệ',
      bookNow: 'Đặt Phòng',
    },
    hero: {
      tagline: 'Nơi Nghỉ Dưỡng Thanh Lịch Giữa Lòng Huế',
      discover: 'Khám Phá',
      reserve: 'Đặt Phòng Ngay',
    },
    story: {
      label: 'Di Sản Của Chúng Tôi',
      title: 'Từ Di Sản\nĐến Khởi Đầu Mới',
      text1: 'Xuất phát từ một gia đình có hơn 30 năm trong ngành dịch vụ khách sạn tại Huế, chúng tôi từng ghi dấu ấn với',
      text2: 'Thành tựu đó không chỉ là niềm tự hào mà còn là nền tảng để chúng tôi bắt đầu một chương mới:',
      quote: '"Nơi mỗi khoảnh khắc chậm lại, trở nên thanh bình, duyên dáng và đầy cảm xúc."',
    },
    experience: {
      label: 'Trải Nghiệm',
      title: 'Nơi Nghỉ Dưỡng Thanh Lịch\nGiữa Lòng Huế',
      text1: 'Thong Dong Quán được tạo ra cho những ai trân trọng sự thanh lịch – từ những doanh nhân, những người khám phá tò mò đến bất kỳ ai tìm kiếm sự bình yên. Lấy cảm hứng từ vẻ đẹp vượt thời gian của cố đô và nghệ thuật sống chậm, nơi đây tập hợp tinh hoa của dịch vụ tinh tế, sự hiểu biết sâu sắc về khách hàng và những nét chạm khắc sáng tạo tinh tế ở mọi góc.',
      text2: 'Tọa lạc tại vị trí đắc địa ở Huế - Phố Tây (khu phố Tây sôi động), và chỉ cách sông Hương lãng mạn một quãng đi bộ ngắn, Thong Dong Quán mang đến một kỳ nghỉ ấm áp, thân mật với một khu phố đầy lựa chọn về ẩm thực và giải trí.',
    },
    facilities: {
      label: 'Tiện Nghi',
      title: 'Cơ Sở Vật Chất & Dịch Vụ',
      intro: 'Tọa lạc tại Phố Đi Bộ Đêm sôi động của Huế (Phố Tây), Khách sạn Boutique Thong Dong Quán được bao quanh bởi lịch sử, văn hóa và nhịp sống địa phương. Chỉ một quãng đi bộ ngắn đưa bạn đến sông Hương, các quán cà phê, với các cửa hàng thủ công.',
      items: {
        breakfast: {
          title: 'Bữa Sáng Chay Miễn Phí',
          desc: '',
        },
        rooms: {
          title: 'Phòng Rộng',
          title2: '32–61m²',
          desc: '',
        },
        location: {
          title: 'Tọa Lạc Tại',
          title2: 'Phố Đi Bộ Đêm',
          title3: 'Sôi Động Của Huế',
          title4: '(Phố Tây)',
          desc: '',
        },
      },
    },
    needs: {
      title: 'Tất Cả Những Gì Bạn Cần',
      intro: 'Mọi thứ bạn cần cho một kỳ nghỉ thoải mái và dễ dàng — từ những tiện nghi hiện đại đến những chi tiết chu đáo khiến bạn cảm thấy như ở nhà.',
      items: {
        bistro: {
          title: 'Bistro & Café',
          desc: 'Phục vụ các món ăn lấy cảm hứng từ Huế và cà phê đặc sản trong một không gian thanh bình, thanh lịch',
        },
        comfort: {
          title: 'Tiện Nghi Thanh Lịch',
          desc: 'Phòng rộng (32–61m²) với giường ngủ chất lượng cao, ban công riêng và ánh sáng tự nhiên dồi dào',
        },
        peace: {
          title: 'An Tâm',
          desc: 'Tận hưởng an ninh 24/7, Wi-Fi miễn phí, dịch vụ giặt ủi và bãi đậu xe tại chỗ cho một kỳ nghỉ suôn sẻ',
        },
        premium: {
          title: 'Nét Cao Cấp',
          desc: 'Tận hưởng các tiện nghi phòng tắm tinh tế và những chi tiết chu đáo nâng cao sự thoải mái hàng ngày của bạn',
        },
      },
    },
    rooms: {
      label: 'Chỗ Ở',
      title: 'Loại Phòng',
      intro: 'Chúng tôi cung cấp nhiều loại phòng chất lượng cao, đáp ứng nhu cầu đa dạng của bạn.',
      perNight: '/đêm',
      bookNow: 'Đặt Phòng',
    },
    gallery: {
      quote: 'Chúng tôi mời bạn – để khi đến Huế, bạn có thể tìm thấy một ngôi nhà thứ hai ở đây, nơi mỗi khoảnh khắc chậm lại, trở nên thanh bình, duyên dáng và đầy cảm xúc.',
    },
    testimonials: {
      title: 'Phản Hồi Từ Khách Hàng',
    },
    contact: {
      title: 'Thong Dong Quán Boutique',
      connect: 'Kết Nối',
      branch: 'Hệ Thống Chi Nhánh',
      facebook: 'Trang Facebook',
    },
    footer: {
      copyright: '© 2025 Thong Dong Quán Boutique. Bảo lưu mọi quyền.',
      powered: 'Sản phẩm được phát triển bởi KiotVietWeb',
    },
  },
};

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="app">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#" className="logo" onClick={() => scrollToSection('hero')}>
            <span className="logo-text">Thong Dong Quán</span>
            <span className="logo-sub">Boutique</span>
          </a>
          <ul className="nav-links">
            <li>
              <a onClick={() => scrollToSection('story')}>{t.nav.story}</a>
            </li>
            <li>
              <a onClick={() => scrollToSection('experience')}>{t.nav.experience}</a>
            </li>
            <li>
              <a onClick={() => scrollToSection('rooms')}>{t.nav.rooms}</a>
            </li>
            <li>
              <a onClick={() => scrollToSection('gallery')}>{t.nav.gallery}</a>
            </li>
            <li>
              <a onClick={() => scrollToSection('testimonials')}>{t.nav.guests}</a>
            </li>
            <li>
              <a onClick={() => scrollToSection('contact')}>{t.nav.contact}</a>
            </li>
          </ul>
          <div className="nav-actions">
            <button 
              className="language-toggle"
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              aria-label="Toggle language"
            >
              {language === 'en' ? 'VI' : 'EN'}
            </button>
            <a
              href="https://bookhotel.kiotviet.vn/bb26440c"
              className="btn-book"
              target="_blank"
              rel="noreferrer"
            >
              {t.nav.bookNow}
            </a>
          </div>
          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-nav-links">
          <li>
            <a onClick={() => scrollToSection('story')}>{t.nav.story}</a>
          </li>
          <li>
            <a onClick={() => scrollToSection('experience')}>{t.nav.experience}</a>
          </li>
          <li>
            <a onClick={() => scrollToSection('rooms')}>{t.nav.rooms}</a>
          </li>
          <li>
            <a onClick={() => scrollToSection('gallery')}>{t.nav.gallery}</a>
          </li>
          <li>
            <a onClick={() => scrollToSection('testimonials')}>{t.nav.guests}</a>
          </li>
          <li>
            <a onClick={() => scrollToSection('contact')}>{t.nav.contact}</a>
          </li>
          <li>
            <button 
              className="language-toggle mobile"
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              aria-label="Toggle language"
            >
              {language === 'en' ? 'VI' : 'EN'}
            </button>
          </li>
          <li>
            <a
              href="https://bookhotel.kiotviet.vn/bb26440c"
              className="mobile-book-btn"
              target="_blank"
              rel="noreferrer"
            >
              {t.nav.bookNow}
            </a>
          </li>
        </ul>
      </div>

      {/* Hero Section */}
      <header id="hero" className="hero">
        <div className="hero-bg">
          <div className="hero-overlay"></div>
          <img src={IMAGES.heroBanner} alt="Thong Dong Quan Boutique" className="hero-img" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span>Est. 2024</span>
          </div>
          <h1 className="hero-title">
            <span className="title-line">Thong Dong</span>
            <span className="title-line accent">Quán</span>
          </h1>
          <p className="hero-tagline">{t.hero.tagline}</p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => scrollToSection('experience')}>
              {t.hero.discover}
            </button>
            <a
              href="https://bookhotel.kiotviet.vn/bb26440c"
              className="btn-outline"
              target="_blank"
              rel="noreferrer"
            >
              {t.hero.reserve}
            </a>
          </div>
          <div className="scroll-indicator">
            <div className="scroll-line"></div>
          </div>
        </div>
      </header>

      {/* Story Section */}
      <section id="story" className="story-section">
        <div className="container">
          <div className="story-grid">
            <div className="story-content-col">
              <span className="section-label">{t.story.label}</span>
              <h2 className="section-title">
                {t.story.title.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t.story.title.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <div className="story-divider">
                <svg viewBox="0 0 60 20" className="lotus-divider">
                  <path d="M30 10 Q20 5 30 0 Q40 5 30 10" fill="currentColor" />
                  <path d="M30 10 Q40 5 50 10 Q40 15 30 10" fill="currentColor" />
                  <path d="M30 10 Q20 15 10 10 Q20 5 30 10" fill="currentColor" />
                </svg>
              </div>
              <p className="story-text">
                {t.story.text1} <strong>Imperial Hotel</strong> – {language === 'en' ? 'the very first privately-owned 5-star hotel in Vietnam.' : 'khách sạn 5 sao tư nhân đầu tiên tại Việt Nam.'}
              </p>
              <p className="story-text">
                {t.story.text2} <strong>Thong Dong Quán</strong>!
              </p>
              <blockquote className="story-quote">
                {t.story.quote}
              </blockquote>
            </div>
            <div className="story-image-col">
              <div className="story-collage">
                <img src={IMAGES.storyPhotos[0]} alt="Imperial Hotel Ceremony" className="story-collage__small story-collage__top-left" />
                <img src={IMAGES.storyPhotos[1]} alt="Award Ceremony" className="story-collage__main" />
                <img src={IMAGES.storyPhotos[2]} alt="Imperial Hotel Team" className="story-collage__small story-collage__bottom-right" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="experience-section">
        <div className="experience-bg"></div>
        <div className="container">
          <div className="experience-grid">
            <div className="experience-image-col">
              <img src={IMAGES.experiencePhoto} alt="An Elegant Stay" className="experience-img" />
            </div>
            <div className="experience-text-col">
              <span className="section-label light">{t.experience.label}</span>
              <h2 className="section-title light">
                {t.experience.title.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t.experience.title.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <p className="experience-intro">
                {t.experience.text1}
              </p>
              <p className="experience-intro">
                {t.experience.text2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="facilities-section">
        <div className="container">
          <div className="facilities-header">
            <span className="section-label">{t.facilities.label}</span>
            <h2 className="section-title">{t.facilities.title}</h2>
            <p className="facilities-intro">
              {t.facilities.intro}
            </p>
          </div>
          <div className="facilities-grid">
            <div className="facility-item">
              <div className="facility-image-wrapper">
                <img src={IMAGES.facilities[0]} alt={t.facilities.items.breakfast.title} className="facility-image" />
              </div>
              <h3>{t.facilities.items.breakfast.title}</h3>
            </div>
            <div className="facility-item">
              <div className="facility-image-wrapper">
                <img src={IMAGES.facilities[1]} alt={t.facilities.items.rooms.title} className="facility-image" />
              </div>
              <h3>
                {t.facilities.items.rooms.title}
                {t.facilities.items.rooms.title2 && (
                  <>
                    <br />
                    {t.facilities.items.rooms.title2}
                  </>
                )}
              </h3>
            </div>
            <div className="facility-item">
              <div className="facility-image-wrapper">
                <img src={IMAGES.facilities[2]} alt={t.facilities.items.location.title} className="facility-image" />
              </div>
              <h3>
                {t.facilities.items.location.title}
                {t.facilities.items.location.title2 && (
                  <>
                    <br />
                    {t.facilities.items.location.title2}
                  </>
                )}
                {t.facilities.items.location.title3 && (
                  <>
                    <br />
                    {t.facilities.items.location.title3}
                  </>
                )}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* All You Need Section */}
      <section className="needs-section">
        <div className="container">
          <div className="needs-header">
            <h2 className="section-title">{t.needs.title}</h2>
            <p>
              {t.needs.intro}
            </p>
          </div>
          <div className="needs-grid">
            <div className="needs-card">
              <div className="needs-logo">
                <img src={IMAGES.logo} alt="Thong Dong Quan Logo" />
              </div>
            </div>
            <div className="needs-items">
              <div className="needs-item">
                <h4>{t.needs.items.bistro.title}</h4>
                <p>
                  {t.needs.items.bistro.desc}
                </p>
              </div>
              <div className="needs-item">
                <h4>{t.needs.items.comfort.title}</h4>
                <p>
                  {t.needs.items.comfort.desc}
                </p>
              </div>
              <div className="needs-item">
                <h4>{t.needs.items.peace.title}</h4>
                <p>
                  {t.needs.items.peace.desc}
                </p>
              </div>
              <div className="needs-item">
                <h4>{t.needs.items.premium.title}</h4>
                <p>
                  {t.needs.items.premium.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="rooms-section">
        <div className="container">
          <div className="rooms-header">
            <span className="section-label">{t.rooms.label}</span>
            <h2 className="section-title">{t.rooms.title}</h2>
            <p className="rooms-intro">
              {t.rooms.intro}
            </p>
          </div>
          <div className="rooms-grid">
            {ROOMS.map((room, index) => (
              <div
                key={index}
                className={`room-card`}
              >
                <div className="room-image">
                  <img
                    src={IMAGES.rooms[index % IMAGES.rooms.length]}
                    alt={room.name}
                  />
                </div>
                <div className="room-content">
                  <h3>{room.name}</h3>
                  <div className="room-price">
                    <span className="price">{room.price}</span>
                    <span className="currency">VND</span>
                    <span className="per">{t.rooms.perNight}</span>
                  </div>
                  <a
                    href="https://bookhotel.kiotviet.vn/bb26440c"
                    className="btn-room"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.rooms.bookNow}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="gallery-header">
            <p className="gallery-quote">
              {t.gallery.quote}
            </p>
          </div>
          <div className="gallery-grid">
            {IMAGES.gallery.map((img, index) => (
              <div key={index} className={`gallery-item`}>
                <img src={img} alt={`Gallery ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="testimonials-bg"></div>
        <div className="container">
          <div className="testimonials-header">
            <h2 className="section-title light">{t.testimonials.title}</h2>
          </div>
          <div className="testimonials-slider">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <div className="stars">★★★★★</div>
                  <p>"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="author-avatar"
                  />
                  <div className="author-info">
                    <strong>{testimonial.name}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3826.1!2d107.589!3d16.463!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDI3JzQ3LjIiTiAxMDfCsDM1JzIwLjQiRQ!5e0!3m2!1sen!2s!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="contact-info">
              <h2 className="contact-title">{t.contact.title}</h2>
              <div className="contact-details">
                <div className="contact-section-group">
                  <h4>{t.contact.connect}</h4>
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <a href="tel:0916134599">091 613 4599</a>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📱</span>
                    <span>035 246 6246</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📘</span>
                    <a
                      href="https://www.facebook.com/thongdongquan.boutique/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.contact.facebook}
                    </a>
                  </div>
                </div>
                <div className="contact-section-group">
                  <h4>{t.contact.branch}</h4>
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <span>01 Phạm Ngũ Lão, Phường Thuận Hóa, Thành phố Huế</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>{t.footer.copyright}</p>
            <p className="footer-powered">{t.footer.powered}</p>
          </div>
        </div>
      </footer>

      {/* Floating Book Button */}
      <a
        href="https://bookhotel.kiotviet.vn/bb26440c"
        className="floating-book"
        target="_blank"
        rel="noreferrer"
      >
        <span>📞</span>
      </a>
    </div>
  );
}

export default App;

