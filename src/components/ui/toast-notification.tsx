
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  id, 
  title, 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "glass-card p-4 min-w-80 max-w-md pointer-events-auto transition-all duration-300 transform-gpu",
        "border-l-4",
        {
          'border-l-green-500': type === 'success',
          'border-l-red-500': type === 'error',
          'border-l-yellow-500': type === 'warning',
          'border-l-blue-500': type === 'info'
        },
        isVisible && !isLeaving && "translate-x-0 opacity-100 scale-100",
        !isVisible && "translate-x-full opacity-0 scale-95",
        isLeaving && "translate-x-full opacity-0 scale-95"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon 
          className={cn(
            "w-5 h-5 mt-0.5 flex-shrink-0",
            {
              'text-green-500': type === 'success',
              'text-red-500': type === 'error',
              'text-yellow-500': type === 'warning',
              'text-blue-500': type === 'info'
            }
          )}
        />
        
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-foreground mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all ease-linear",
              {
                'bg-green-500': type === 'success',
                'bg-red-500': type === 'error',
                'bg-yellow-500': type === 'warning',
                'bg-blue-500': type === 'info'
              }
            )}
            style={{
              animation: `toast-progress ${duration}ms linear`,
              transformOrigin: 'left'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Toast container
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none safe-top safe-right">
    {children}
  </div>
);

// Add CSS for progress bar animation
const style = document.createElement('style');
style.textContent = `
  @keyframes toast-progress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
`;
document.head.appendChild(style);
