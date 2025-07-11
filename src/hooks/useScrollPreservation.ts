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
  const isChangingAgentRef = useRef(false);
  
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
  
  const restoreScrollPosition = useCallback((container?: HTMLElement, attempts = 0) => {
    const element = container || containerRef.current;
    const savedState = scrollStateRef.current;
    
    if (!element || !savedState) return false;

    const maxAttempts = 5;
    
    const tryRestore = () => {
      const targetPosition = savedState.isAtBottom 
        ? element.scrollHeight - element.clientHeight 
        : savedState.scrollTop;
      
      element.scrollTop = targetPosition;
      
      // Verificar se a restauração foi bem-sucedida
      const tolerance = 10;
      const actualPosition = element.scrollTop;
      const isSuccessful = Math.abs(actualPosition - targetPosition) <= tolerance;
      
      if (isSuccessful) {
        console.log('🔄 Scroll position successfully restored:', {
          target: targetPosition,
          actual: actualPosition,
          isAtBottom: savedState.isAtBottom
        });
        
        // Limpar estado apenas quando bem-sucedido
        scrollStateRef.current = null;
        preserveOnNextRender.current = false;
        isChangingAgentRef.current = false;
        
        return true;
      } else if (attempts < maxAttempts) {
        console.log(`🔄 Retry scroll restoration (${attempts + 1}/${maxAttempts})`);
        requestAnimationFrame(() => restoreScrollPosition(container, attempts + 1));
      } else {
        console.warn('❌ Failed to restore scroll position after max attempts');
        scrollStateRef.current = null;
        preserveOnNextRender.current = false;
        isChangingAgentRef.current = false;
      }
      
      return false;
    };

    return tryRestore();
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

  const setChangingAgent = useCallback((isChanging: boolean) => {
    isChangingAgentRef.current = isChanging;
    console.log('🔄 Agent changing state:', isChanging);
  }, []);

  const isChangingAgent = useCallback(() => {
    return isChangingAgentRef.current;
  }, []);
  
  return {
    saveScrollPosition,
    restoreScrollPosition,
    setPreserveOnNextRender,
    shouldPreserve,
    setContainerRef,
    isAtBottom,
    setChangingAgent,
    isChangingAgent
  };
};