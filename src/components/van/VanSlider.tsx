"use client";

import { useEffect } from "react";

export default function VanSlider() {
  
  useEffect(() => {
    // Gestion des slideshows
    const slideshowContainers = document.querySelectorAll('.slideshow-container');
    slideshowContainers.forEach(container => {
      const slides = container.querySelectorAll('img');
      const interval = parseInt((container as HTMLElement).dataset.slideshow || '') || 3000;
      let currentIndex = 0;
      
      const intervalId = setInterval(() => {
        slides[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
      }, interval);

      return () => clearInterval(intervalId);
    });

    // Slider mobile
    const slider = document.getElementById('van-slider');
    if (!slider) return;

    const cards = Array.from(slider.children);
    let activeIndex = 0; // Yoni par défaut
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

    // Centrer Yoni au démarrage et le laisser actif
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
        /* ===== Section ===== */
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

        /* ===== Card ===== */
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

        /* ===== Image Slideshow ===== */
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

        /* ===== Card Content ===== */
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
          padding-bottom: 0.6rem;         /* espace sous le modèle */
          border-bottom: 1px solid #eee;  /* ligne fine */
        }

        /* ===== Features ===== */
        .van-features {
          list-style: none;
          margin: 0.8rem 0 0;             /* espace supplémentaire sous la ligne */
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
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }

        .van-features svg {
          fill: #A6CE39;
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

        /* ===== Bouton gris très clair ===== */
        .van-btn {
          display: inline-block;
          padding: 0.4rem 0.9rem;
          background: #f0f0f0;            /* gris très clair */
          color: #333;                    /* texte foncé */
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
          border-radius: 6px;
          transition: background 0.3s;
          border: 1px solid #ddd;
        }

        .van-btn:hover {
          background: #e0e0e0;            /* gris légèrement plus foncé */
        }

        /* ===== Mobile Slider ===== */
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
            opacity: 0.4;                      /* opacité réduite par défaut */
          }

          .van-card.active {
            opacity: 1;                         /* carte active opaque */
            transform: scale(1.02);
          }
        }
      `}</style>

      <section className="vans-section">
        <div className="vans-container" id="van-slider">

          {/* Yoni */}
          <div className="van-card active">  {/* Yoni est active dès le départ */}
            <div className="slideshow-container" data-slideshow="3000">
              <img src="https://iili.io/KGOKoq7.png" alt="van aménagé renault trafic III Yoni fermé Vanzon Explorer" className="active" />
              <img src="https://iili.io/KGOKCsS.png" alt="van aménagé renault trafic III Yoni ouvert Vanzon Explorer" />
              <img src="https://iili.io/KGeBURn.png" alt="van aménagé renault trafic III Yoni océan Vanzon Explorer" />
            </div>
            <div className="van-content">
              <div className="van-name">Yoni</div>
              <div className="van-model">Renault Trafic III</div>
              <ul className="van-features">
                <li><img src="https://iili.io/KGvOdtS.png" alt="icone siege auto" />3 sièges</li>
                <li><img src="https://iili.io/KGvOHAl.png" alt="icone lit" />2+1 couchages</li>
                <li><img src="https://iili.io/KGvO3o7.png" alt="icone cuisine" />Cuisine coulissante</li>
                <li><img src="https://iili.io/KGvOJN2.png" alt="icone flocon glacière" />Glacière portative</li>
                <li><img src="https://iili.io/KGvOFV9.png" alt="icone toilette seche" />Toilette sèche</li>
              </ul>
              <div className="van-footer">
                <div className="van-price">à partir de 65 € / nuit</div>
                <a href="https://www.yescapa.fr/campers/89215" target="_blank" rel="noopener noreferrer" className="van-btn">Plus d&apos;informations</a>
              </div>
            </div>
          </div>

          {/* Xalbat */}
          <div className="van-card">
            <div className="slideshow-container" data-slideshow="3000">
              <img src="https://iili.io/KGOKqzl.png" alt="van aménagé renault trafic III Xalbat fermé Vanzon Explorer" className="active" />
              <img src="https://iili.io/KGOKBX2.png" alt="van aménagé renault trafic III Xalbat ouvert Vanzon Explorer" />
              <img src="https://iili.io/KGeBrDG.png" alt="van aménagé renault trafic III Xalbat montagne Vanzon Explorer" />
            </div>
            <div className="van-content">
              <div className="van-name">Xalbat</div>
              <div className="van-model">Renault Trafic III</div>
              <ul className="van-features">
                <li><img src="https://iili.io/KGvOdtS.png" alt="icone siege auto" />3 sièges</li>
                <li><img src="https://iili.io/KGvOHAl.png" alt="icone lit" />2+1 couchages</li>
                <li><img src="https://iili.io/KGvO3o7.png" alt="icone cuisine" />Cuisine coulissante</li>
                <li><img src="https://iili.io/KGvOJN2.png" alt="icone flocon glacière" />Glacière portative</li>
                <li><img src="https://iili.io/KGvOFV9.png" alt="icone toilette seche" />Toilette sèche</li>
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
