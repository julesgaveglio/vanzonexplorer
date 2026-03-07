"use client";

import { useEffect } from "react";

export default function VanSlider() {
  useEffect(() => {
    const intervalIds: NodeJS.Timeout[] = [];

    document.querySelectorAll('.slideshow-container').forEach(container => {
      const slides = container.querySelectorAll('img');
      const delay = parseInt((container as HTMLElement).dataset.slideshow || '') || 3000;
      let currentIndex = 0;

      intervalIds.push(setInterval(() => {
        slides[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
      }, delay));
    });

    const slider = document.getElementById('van-slider');
    if (!slider) return () => intervalIds.forEach(clearInterval);

    const cards = Array.from(slider.children);
    let activeIndex = 0;
    let isScrolling = false;

    const updateActiveCard = () => {
      const sliderCenter = slider.scrollLeft + slider.clientWidth / 2;
      cards.forEach((card, i) => {
        const cardElement = card as HTMLElement;
        const cardCenter = cardElement.offsetLeft + cardElement.offsetWidth / 2;
        const isActive = Math.abs(cardCenter - sliderCenter) < cardElement.offsetWidth / 2;
        cardElement.classList.toggle('active', isActive);
        if (isActive) activeIndex = i;
      });
    };

    const centerCard = (index: number) => {
      const card = cards[index] as HTMLElement;
      const scrollLeft = card.offsetLeft + card.offsetWidth / 2 - slider.clientWidth / 2;
      slider.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    };

    setTimeout(() => {
      centerCard(0);
      cards[0]?.classList.add('active');
    }, 100);

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (!isScrolling) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateActiveCard, 50);
      }
    };

    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isScrolling = false;
    };

    const handleTouchMove = () => {
      isScrolling = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 50 && !isScrolling) {
        activeIndex = diff > 0 ? Math.min(activeIndex + 1, cards.length - 1) : Math.max(activeIndex - 1, 0);
        centerCard(activeIndex);
      } else {
        setTimeout(updateActiveCard, 100);
      }
      isScrolling = false;
    };

    slider.addEventListener('scroll', handleScroll);
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchmove', handleTouchMove);
    slider.addEventListener('touchend', handleTouchEnd);

    return () => {
      intervalIds.forEach(clearInterval);
      slider.removeEventListener('scroll', handleScroll);
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchmove', handleTouchMove);
      slider.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      <style jsx>{`
        .vans-section {
          padding: 2rem 1rem;
          background: transparent;
          display: flex;
          justify-content: center;
        }

        .vans-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
          justify-content: center;
          gap: 2rem;
          max-width: 1080px;
          width: 100%;
        }

        .van-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
        }

        .van-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.15);
        }

        .slideshow-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
        }

        .slideshow-container img {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 1s ease-in-out;
        }

        .slideshow-container img.active {
          opacity: 1;
        }

        .van-content {
          padding: 1rem 1rem 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
        }

        .van-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: #111;
          margin: 0;
          line-height: 1.2rem;
        }

        .van-model {
          font-size: 0.9rem;
          font-weight: 400;
          color: #666;
          margin: 0;
          line-height: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #eee;
        }

        .van-features {
          list-style: none;
          margin: 0.8rem 0 0;
          padding: 0;
          display: grid;
          gap: 0.4rem;
          font-size: 0.95rem;
          color: #444;
        }

        .van-features li {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          line-height: 1.3rem;
        }

        .van-features svg,
        .van-features img {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .van-features svg {
          color: #9CA3AF;
        }

        .van-footer {
          text-align: center;
          margin-top: auto;
          padding-top: 0.6rem;
          border-top: 1px solid #eee;
        }

        .van-price {
          font-size: 1rem;
          font-weight: 700;
          color: #000;
          margin-bottom: 0.4rem;
        }

        .van-btn {
          display: inline-block;
          padding: 0.4rem 0.9rem;
          background: #f0f0f0;
          color: #333;
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
          border-radius: 6px;
          transition: background 0.3s;
          border: 1px solid #ddd;
        }

        .van-btn:hover {
          background: #e0e0e0;
        }

        @media (max-width: 768px) {
          .vans-section {
            padding: 2rem 0;
          }

          .vans-container {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 1rem;
            padding: 1.5rem 0;
            scroll-padding: 0 calc(50vw - 150px);
          }

          .vans-container::before,
          .vans-container::after {
            content: '';
            flex: 0 0 calc(50vw - 150px);
          }

          .van-card {
            flex: 0 0 300px;
            scroll-snap-align: center;
            scroll-snap-stop: always;
            opacity: 0.4;
          }

          .van-card.active {
            opacity: 1;
            transform: scale(1.02);
          }
        }
      `}</style>

      <section className="vans-section">
        <div className="vans-container" id="van-slider">

          <div className="van-card active">
            <div className="slideshow-container" data-slideshow="3000">
              <img src="https://cdn.sanity.io/images/lewexa74/production/2e9214211ef5a235dcf2aa639d0feafcc867c88f-1080x750.png" alt="van aménagé renault trafic III Yoni fermé Vanzon Explorer" className="active" />
              <img src="https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png" alt="van aménagé renault trafic III Yoni ouvert Vanzon Explorer" />
              <img src="https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png" alt="van aménagé renault trafic III Yoni océan Vanzon Explorer" />
            </div>
            <div className="van-content">
              <div className="van-name">Yoni</div>
              <div className="van-model">Renault Trafic III</div>
              <ul className="van-features">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>3 sièges</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>2+1 couchages</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>Cuisine coulissante</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>Glacière portative</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .4 20 .4s-1.5 12-8.7 17c-1.2.8-2.5 1.3-3.8 1.5"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>Toilette sèche</li>
              </ul>
              <div className="van-footer">
                <div className="van-price">à partir de 65 € / nuit</div>
                <a href="https://www.yescapa.fr/campers/89215" target="_blank" rel="noopener noreferrer" className="van-btn">Plus d&apos;informations</a>
              </div>
            </div>
          </div>

          <div className="van-card">
            <div className="slideshow-container" data-slideshow="3000">
              <img src="https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png" alt="van aménagé renault trafic III Xalbat fermé Vanzon Explorer" className="active" />
              <img src="https://cdn.sanity.io/images/lewexa74/production/e07cf63507850084bee14fca9a91b4efe5b7d18a-1080x750.png" alt="van aménagé renault trafic III Xalbat ouvert Vanzon Explorer" />
              <img src="https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png" alt="van aménagé renault trafic III Xalbat montagne Vanzon Explorer" />
            </div>
            <div className="van-content">
              <div className="van-name">Xalbat</div>
              <div className="van-model">Renault Trafic III</div>
              <ul className="van-features">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>3 sièges</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>2+1 couchages</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>Cuisine coulissante</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>Glacière portative</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .4 20 .4s-1.5 12-8.7 17c-1.2.8-2.5 1.3-3.8 1.5"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>Toilette sèche</li>
              </ul>
              <div className="van-footer">
                <div className="van-price">à partir de 65 € / nuit</div>
                <a href="https://www.yescapa.fr/campers/98869" target="_blank" rel="noopener noreferrer" className="van-btn">Plus d&apos;informations</a>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
