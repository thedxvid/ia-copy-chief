
import React, { useEffect, useState } from 'react';

interface TutorialSpotlightProps {
  targetElement?: string;
  isActive: boolean;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  targetElement,
  isActive
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetElement || !isActive) {
      setElementRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementRect(rect);
      }
    };

    updatePosition();
    
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [targetElement, isActive]);

  if (!isActive || !elementRect) {
    return null;
  }

  const spotlightStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: `radial-gradient(circle at ${elementRect.left + elementRect.width / 2}px ${elementRect.top + elementRect.height / 2}px, transparent ${Math.max(elementRect.width, elementRect.height) / 2 + 10}px, rgba(0, 0, 0, 0.7) ${Math.max(elementRect.width, elementRect.height) / 2 + 20}px)`,
    pointerEvents: 'none' as const,
    zIndex: 9998,
    transition: 'background 0.3s ease-in-out'
  };

  const highlightStyle = {
    position: 'fixed' as const,
    left: elementRect.left - 4,
    top: elementRect.top - 4,
    width: elementRect.width + 8,
    height: elementRect.height + 8,
    border: '2px solid #3B82F6',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
    pointerEvents: 'none' as const,
    zIndex: 9999,
    animation: 'pulse 2s infinite'
  };

  return (
    <>
      <div style={spotlightStyle} />
      <div style={highlightStyle} />
    </>
  );
};
