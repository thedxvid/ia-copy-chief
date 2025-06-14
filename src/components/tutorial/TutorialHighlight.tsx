
import React, { useEffect, useState } from 'react';

interface TutorialHighlightProps {
  targetElement?: string;
  isActive: boolean;
  children?: React.ReactNode;
}

export const TutorialHighlight: React.FC<TutorialHighlightProps> = ({
  targetElement,
  isActive,
  children
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
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetElement, isActive]);

  if (!isActive || !elementRect) {
    return null;
  }

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9999]"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Spotlight */}
      <div
        className="fixed z-[10000] pointer-events-none"
        style={{
          left: elementRect.left - 8,
          top: elementRect.top - 8,
          width: elementRect.width + 16,
          height: elementRect.height + 16,
          boxShadow: `
            0 0 0 4px rgba(59, 130, 246, 0.5),
            0 0 0 9999px rgba(0, 0, 0, 0.6)
          `,
          borderRadius: '8px',
          animation: 'pulse 2s infinite',
        }}
      />
      
      {children}
    </>
  );
};
