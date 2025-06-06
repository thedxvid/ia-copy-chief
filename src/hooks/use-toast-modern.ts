
import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToastModern = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message: string, title?: string) => 
      addToast({ message, title, type: 'success' }),
    error: (message: string, title?: string) => 
      addToast({ message, title, type: 'error' }),
    warning: (message: string, title?: string) => 
      addToast({ message, title, type: 'warning' }),
    info: (message: string, title?: string) => 
      addToast({ message, title, type: 'info' }),
  };

  return {
    toasts,
    toast,
    removeToast,
  };
};
