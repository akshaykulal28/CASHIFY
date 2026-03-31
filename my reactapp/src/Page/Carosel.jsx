import React, { useState, useEffect, useCallback } from 'react';
import '../CSS/Carasol.css';

import b1 from '../assets/b1.avif';
import b2 from '../assets/b2.avif';
import b3 from '../assets/b3.avif';
import b4 from '../assets/b4.avif';
import banner3 from '../assets/banner3.avif';

function Carousel() {
  const slides = [b1, b2, b3, b4, banner3];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div className="carousel-slide" key={index}>
              <img src={slide} alt={`Banner ${index + 1}`} />
            </div>
          ))}
        </div>

        <button className="carousel-btn carousel-btn-prev" onClick={prevSlide}>
          ‹
        </button>
        <button className="carousel-btn carousel-btn-next" onClick={nextSlide}>
          ›
        </button>
      </div>

      <div className="carousel-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;