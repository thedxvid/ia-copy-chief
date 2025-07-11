import { useRef, useCallback } from 'react';

interface ScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isAtBottom: boolean;
  timestamp: number;
}

export const useScrollPreservation = () => {
  const scrollStateRef = useRef<ScrollState | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const preserveOnNextRender = useRef(false);
  
  const saveScrollPosition = useCallback((container?: HTMLElement) => {
    const element = container || containerRef.current;
    if (!element) return;
    
    const scrollState: ScrollState = {
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      isAtBottom: element.scrollTop + element.clientHeight >= element.scrollHeight - 5,
      timestamp: Date.now()
    };
    
    scrollStateRef.current = scrollState;
    
    console.log('💾 Scroll position saved:', {
      scrollTop: scrollState.scrollTop,
      isAtBottom: scrollState.isAtBottom,
      total: scrollState.scrollHeight
    });
  }, []);
  
  const restoreScrollPosition = useCallback((container?: HTMLElement) => {
    const element = container || containerRef.current;
    const savedState = scrollStateRef.current;
    
    if (!element || !savedState) return false;
    
    // Se estava no final, manter no final
    if (savedState.isAtBottom) {
      element.scrollTop = element.scrollHeight - element.clientHeight;
      console.log('🔄 Restored to bottom');
    } else {
      // Se não estava no final, restaurar posição exata
      element.scrollTop = savedState.scrollTop;
      console.log('🔄 Restored to position:', savedState.scrollTop);
    }
    
    // Limpar estado salvo após uso
    scrollStateRef.current = null;
    preserveOnNextRender.current = false;
    
    return true;
  }, []);
  
  const setPreserveOnNextRender = useCallback(() => {
    preserveOnNextRender.current = true;
  }, []);
  
  const shouldPreserve = useCallback(() => {
    return preserveOnNextRender.current;
  }, []);
  
  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);
  
  const isAtBottom = useCallback((container?: HTMLElement) => {
    const element = container || containerRef.current;
    if (!element) return false;
    
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
  }, []);
  
  return {
    saveScrollPosition,
    restoreScrollPosition,
    setPreserveOnNextRender,
    shouldPreserve,
    setContainerRef,
    isAtBottom
  };
};