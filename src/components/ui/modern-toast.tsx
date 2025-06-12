
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';

interface ModernToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'celebration';
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const ModernToast: React.FC<ModernToastProps> = ({ 
  id, 
  title, 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Slide in animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Progress countdown
    if (duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);
      
      // Auto close
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => {
        clearTimeout(showTimer);
        clearInterval(progressInterval);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(showTimer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    celebration: Sparkles
  };

  const Icon = icons[type];

  const getPositionClasses = () => {
    const baseClasses = "fixed z-50 pointer-events-auto";
    const positions = {
      'top-right': `${baseClasses} top-4 right-4`,
      'top-left': `${baseClasses} top-4 left-4`,
      'bottom-right': `${baseClasses} bottom-4 right-4`,
      'bottom-left': `${baseClasses} bottom-4 left-4`,
      'top-center': `${baseClasses} top-4 left-1/2 -translate-x-1/2`
    };
    return positions[position];
  };

  const getSlideDirection = () => {
    if (position.includes('right')) return isVisible && !isLeaving ? 'translate-x-0' : 'translate-x-full';
    if (position.includes('left')) return isVisible && !isLeaving ? 'translate-x-0' : '-translate-x-full';
    if (position.includes('center')) return isVisible && !isLeaving ? 'translate-y-0' : '-translate-y-full';
    return 'translate-x-0';
  };

  return (
    <div className={getPositionClasses()}>
      <div
        className={cn(
          "glass-card min-w-80 max-w-md transition-all duration-300 transform-gpu",
          "border-l-4 shadow-2xl",
          {
            'border-l-green-500': type === 'success' || type === 'celebration',
            'border-l-red-500': type === 'error',
            'border-l-yellow-500': type === 'warning',
            'border-l-blue-500': type === 'info'
          },
          getSlideDirection(),
          isVisible && !isLeaving && "opacity-100 scale-100",
          !isVisible && "opacity-0 scale-95",
          isLeaving && "opacity-0 scale-95",
          type === 'celebration' && "animate-pulse-glow"
        )}
      >
        {/* Celebration confetti effect */}
        {type === 'celebration' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Icon 
              className={cn(
                "w-6 h-6 mt-0.5 flex-shrink-0 transition-all duration-300",
                {
                  'text-green-500': type === 'success' || type === 'celebration',
                  'text-red-500': type === 'error',
                  'text-yellow-500': type === 'warning',
                  'text-blue-500': type === 'info'
                },
                type === 'celebration' && "animate-pulse-glow"
              )}
            />
            
            <div className="flex-1 min-w-0">
              {title && (
                <p className="font-semibold text-foreground mb-1 text-sm">
                  {title}
                </p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-all duration-200 interactive-gentle touch-target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-2xl overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all ease-linear rounded-b-2xl",
                {
                  'bg-green-500': type === 'success' || type === 'celebration',
                  'bg-red-500': type === 'error',
                  'bg-yellow-500': type === 'warning',
                  'bg-blue-500': type === 'info'
                }
              )}
              style={{
                width: `${progress}%`,
                transition: 'width 100ms linear'
              }}
            />
          </div>
        )}
        
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none",
          "bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5",
          isVisible && "opacity-100"
        )} />
      </div>
    </div>
  );
};

// Toast container
export const ModernToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 pointer-events-none z-50 safe-top safe-right safe-bottom safe-left">
    {children}
  </div>
);
