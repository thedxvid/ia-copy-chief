
import React from 'react';
import { ModalPosition } from '@/hooks/useTutorialPositioning';

interface TutorialPointerProps {
  modalPosition: ModalPosition;
  targetElement?: string;
}

export const TutorialPointer: React.FC<TutorialPointerProps> = ({
  modalPosition,
  targetElement
}) => {
  if (!targetElement || modalPosition.position === 'center') {
    return null;
  }

  const getPointerStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      zIndex: 10002
    };

    switch (modalPosition.position) {
      case 'right':
        return {
          ...baseStyle,
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '8px solid #1E1E1E'
        };
      case 'left':
        return {
          ...baseStyle,
          right: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '8px solid #1E1E1E'
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid #1E1E1E'
        };
      case 'top':
        return {
          ...baseStyle,
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #1E1E1E'
        };
      default:
        return { display: 'none' };
    }
  };

  return <div style={getPointerStyle()} />;
};
