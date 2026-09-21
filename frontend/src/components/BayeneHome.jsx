import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import bayene1 from '../assets/carousselLunette/bayene1.png';
import bayene2 from '../assets/carousselLunette/bayene2.png';
import bayene3 from '../assets/carousselLunette/bayene3.png';
import bayeneHome from '../assets/bayeneHome.png';
import backgroundImage from '../assets/bg-bayene.jpg';

const BayeneHome = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [navHeight, setNavHeight] = useState(90);
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  const heroRef = useRef(null);

  // Synchronisation dynamique de la hauteur de la Navbar
  useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.querySelector('nav');

      if (nav) {
        setNavHeight(nav.offsetHeight);
      }
    };

    updateNavHeight();

    window.addEventListener('resize', updateNavHeight);
    window.addEventListener('scroll', updateNavHeight);

    return () => {
      window.removeEventListener('resize', updateNavHeight);
      window.removeEventListener('scroll', updateNavHeight);
    };
  }, []);

  // Détection de l'affichage du Hero
  useEffect(() => {
    const node = heroRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsHeroVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, []);

  const slides = [
    {
      id: 1,
      image: bayene1,
      title: 'Nouvelle Collection 2026',
      subtitle:
        'Découvrez nos lunettes de vue aux designs élégants et modernes',
      cta: 'Explorer la collection',
      link: '/collection',
    },
    {
      id: 2,
      image: bayene2,
      title: 'Promotion Exclusive -30%',
      subtitle:
        'Profitez de nos offres spéciales sur une sélection de modèles pour un temps limité',
      cta: "Profiter de l'offre",
      link: '/collection',
    },
    {
      id: 3,
      image: bayene3,
      title: 'Livraison Gratuite',
      subtitle:
        'Profitez de la livraison offerte pour toute commande supérieure à 100€',
      cta: 'Commander maintenant',
      link: '/cart',
    },
  ];

  const AUTOPLAY_INTERVAL = 15000;
  const TRANSITION_DURATION = 1500;

  const goToSlide = useCallback(
    (index) => {
      if (isTransitioning || index === currentIndex) return;

      setIsTransitioning(true);
      setCurrentIndex(index);

      setTimeout(() => {
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
    },
    [currentIndex, isTransitioning]
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, goToSlide, slides.length]);

  const prevSlide = useCallback(() => {
    goToSlide(
      (currentIndex - 1 + slides.length) % slides.length
    );
  }, [currentIndex, goToSlide, slides.length]);

  useEffect(() => {
    if (isTransitioning) return;

    const interval = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [currentIndex, isTransitioning, nextSlide]);

  return (
    <div
      className="relative w-full bg-[#121212] font-sans overflow-x-hidden min-h-screen"
      style={{ paddingTop: `${navHeight}px` }}
    >
      {/* ARRIÈRE-PLAN GLOBAL FIXE */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          opacity: 0.5,
        }}
      />

      {/* Voile sombre global unifié */}
      <div className="fixed inset-0 bg-black/5 z-0 pointer-events-none" />

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col gap-12 pb-16">

        {/* CARROUSEL PRINCIPAL */}
        <div className="relative w-full h-[50vh] sm:h-[65vh] md:h-[75vh] lg:h-[82vh] overflow-hidden bg-transparent shadow-none">
          <div className="relative w-full h-full">

            {slides.map((slide, index) => {
              const isCurrent = index === currentIndex;
              const isNext =
                index === (currentIndex + 1) % slides.length;

              let translateX = '0';
              let opacity = 1;
              let zIndex = 10;

              if (isTransitioning) {
                if (isCurrent) {
                  translateX = '100%';
                  opacity = 0;
                  zIndex = 10;
                } else if (isNext) {
                  translateX = '0';
                  opacity = 1;
                  zIndex = 15;
                } else {
                  translateX = '100%';
                  opacity = 0;
                  zIndex = 1;
                }
              } else {
                if (isCurrent) {
                  translateX = '0';
                  opacity = 1;
                  zIndex = 20;
                } else if (isNext) {
                  translateX = '-100%';
                  opacity = 0;
                  zIndex = 5;
                } else {
                  translateX = '100%';
                  opacity = 0;
                  zIndex = 1;
                }
              }

              const objectPosition =
                index === 1 ? 'center 35%' : 'center center';

              return (
                <div
                  key={slide.id}
                  className="absolute top-0 left-0 w-full h-full transition-all ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{
                    transform: `translateX(${translateX})`,
                    opacity,
                    zIndex,
                    transitionDuration: `${TRANSITION_DURATION}ms`,
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-no-repeat transform scale-105 transition-transform duration-[15000ms]"
                    style={{
                      backgroundImage: `url(${slide.image})`,
                      backgroundPosition: objectPosition,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end z-20 pointer-events-none">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-8 sm:pb-12 md:pb-16 pointer-events-auto">

                      {(isCurrent || isNext) && (
                        <div className="animate-fade-in-up max-w-2xl">

                          <span className="text-[#9E6B6B] font-mono tracking-widest uppercase text-xs sm:text-sm mb-2 block font-semibold">
                            Bayene Eyewear
                          </span>

                          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic text-white drop-shadow-lg mb-3">
                            {slide.title}
                          </h2>

                          <div className="w-12 h-[1.5px] bg-[#9E6B6B] mb-4" />

                          <p className="text-xs sm:text-sm md:text-base text-gray-200 font-light leading-relaxed mb-6 drop-shadow-sm">
                            {slide.subtitle}
                          </p>

                          <Link
                            to={slide.link}
                            style={{ borderRadius: '0px' }}
                            className="inline-flex items-center gap-3 bg-white text-[#2C2C2C] px-6 sm:px-8 py-3 text-xs sm:text-sm uppercase tracking-wider font-medium transition-all duration-300 hover:bg-[#9E6B6B] hover:text-white shadow-lg rounded-none group cursor-pointer"
                          >
                            <span>{slide.cta}</span>
                          </Link>

                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Indicateurs de slide */}
          <div className="absolute bottom-4 right-6 sm:right-10 flex gap-2 z-30">

            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                style={{ borderRadius: '0px' }}
                className={`transition-all duration-500 rounded-none cursor-pointer ${
                  index === currentIndex
                    ? 'bg-[#9E6B6B] w-8 h-1 shadow-md'
                    : 'bg-white/40 w-2 h-1 hover:bg-white'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}

          </div>

          {/* Boutons de navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm p-2 sm:p-3 transition-all duration-300 z-30 cursor-pointer"
            aria-label="Slide précédent"
          >
            <ChevronLeft
              size={20}
              className="sm:w-6 sm:h-6"
              strokeWidth={1.5}
            />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm p-2 sm:p-3 transition-all duration-300 z-30 cursor-pointer"
            aria-label="Slide suivant"
          >
            <ChevronRight
              size={20}
              className="sm:w-6 sm:h-6"
              strokeWidth={1.5}
            />
          </button>

        </div>

        {/* SECTION HERO / BRANDING */}
        <section
          ref={heroRef}
          className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col items-center text-center bg-transparent"
        >
          <div className="relative w-full max-h-[350px] sm:max-h-[450px] overflow-hidden flex items-center justify-center p-4">

            <img
              src={bayeneHome}
              alt="Bayene Home Visual"
              className={`w-full h-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-700 ${
                isHeroVisible
                  ? 'animate-slideInFromLeft'
                  : 'opacity-0'
              }`}
            />

          </div>

          <div className="mt-6 max-w-xl">
            <p className="text-xs sm:text-sm font-serif italic text-gray-400 tracking-wider">
              « L'art de voir et d'être vu à travers des montures d'exception, conçues pour sublimer votre regard. »
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default BayeneHome;