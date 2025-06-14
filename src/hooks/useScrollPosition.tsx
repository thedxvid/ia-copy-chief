
import { useEffect, useState, useCallback } from 'react';

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

  const updateScrollPosition = useCallback(() => {
    const scrollY = window.scrollY;
    const isScrolled = scrollY > threshold;
    
    setScrollPosition(prev => {
      const isScrollingUp = scrollY < prev.scrollY && scrollY > threshold;
      const isScrollingDown = scrollY > prev.scrollY;

      // Only update if there's actually a change to prevent unnecessary re-renders
      if (
        prev.scrollY === scrollY &&
        prev.isScrolled === isScrolled &&
        prev.isScrollingUp === isScrollingUp &&
        prev.isScrollingDown === isScrollingDown
      ) {
        return prev;
      }

      return {
        scrollY,
        isScrolled,
        isScrollingUp,
        isScrollingDown,
      };
    });
  }, [threshold]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial position
    updateScrollPosition();
    
    // Add passive scroll listener for better performance
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [updateScrollPosition]);

  return scrollPosition;
};
