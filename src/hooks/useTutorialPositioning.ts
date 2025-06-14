
import { useState, useEffect, useCallback } from 'react';

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ModalPosition {
  top: number;
  left: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const useTutorialPositioning = (targetSelector?: string) => {
  const [elementPosition, setElementPosition] = useState<Position | null>(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition>({
    top: 50,
    left: 50,
    position: 'center'
  });

  const calculatePosition = useCallback(() => {
    if (!targetSelector) {
      setModalPosition({
        top: 50,
        left: 50,
        position: 'center'
      });
      return;
    }

    const element = document.querySelector(targetSelector);
    if (!element) {
      setElementPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const newPosition: Position = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };

    setElementPosition(newPosition);

    // Calcular melhor posição para o modal
    const modalWidth = 500; // largura estimada do modal
    const modalHeight = 400; // altura estimada do modal
    const spacing = 20;

    let modalPos: ModalPosition = {
      top: 50,
      left: 50,
      position: 'center'
    };

    // Verificar se há espaço à direita
    if (rect.right + modalWidth + spacing < viewport.width) {
      modalPos = {
        top: Math.max(spacing, rect.top - modalHeight / 2 + rect.height / 2),
        left: rect.right + spacing,
        position: 'right'
      };
    }
    // Verificar se há espaço à esquerda
    else if (rect.left - modalWidth - spacing > 0) {
      modalPos = {
        top: Math.max(spacing, rect.top - modalHeight / 2 + rect.height / 2),
        left: rect.left - modalWidth - spacing,
        position: 'left'
      };
    }
    // Verificar se há espaço abaixo
    else if (rect.bottom + modalHeight + spacing < viewport.height) {
      modalPos = {
        top: rect.bottom + spacing,
        left: Math.max(spacing, rect.left - modalWidth / 2 + rect.width / 2),
        position: 'bottom'
      };
    }
    // Verificar se há espaço acima
    else if (rect.top - modalHeight - spacing > 0) {
      modalPos = {
        top: rect.top - modalHeight - spacing,
        left: Math.max(spacing, rect.left - modalWidth / 2 + rect.width / 2),
        position: 'top'
      };
    }
    // Fallback para centro
    else {
      modalPos = {
        top: viewport.height / 2 - modalHeight / 2,
        left: viewport.width / 2 - modalWidth / 2,
        position: 'center'
      };
    }

    // Garantir que o modal não saia da tela
    modalPos.top = Math.max(spacing, Math.min(modalPos.top, viewport.height - modalHeight - spacing));
    modalPos.left = Math.max(spacing, Math.min(modalPos.left, viewport.width - modalWidth - spacing));

    setModalPosition(modalPos);
  }, [targetSelector]);

  useEffect(() => {
    calculatePosition();

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [calculatePosition]);

  return {
    elementPosition,
    modalPosition,
    recalculate: calculatePosition
  };
};
