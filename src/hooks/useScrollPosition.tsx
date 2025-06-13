
import { useEffect, useState } from 'react';

interface ScrollPosition {
  scrollY: number;
  isScrolled: boolean;
  isScrollingUp: boolean;
  isScrollingDown: boolean;
}

export const useScrollPosition = (threshold: number = 10): ScrollPosition => {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    scrollY: 0,
    isScrolled: false,
    isScrollingUp: false,
    isScrollingDown: false,
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollPosition = () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > threshold;
      const isScrollingUp = scrollY < lastScrollY && scrollY > threshold;
      const isScrollingDown = scrollY > lastScrollY;

      setScrollPosition({
        scrollY,
        isScrolled,
        isScrollingUp,
        isScrollingDown,
      });

      lastScrollY = scrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollPosition(); // Set initial position

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return scrollPosition;
};
