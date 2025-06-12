
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ModernProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'gradient' | 'solid' | 'glass' | 'neomorph';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const ModernProgress: React.FC<ModernProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = 'gradient',
  size = 'md',
  animated = true,
  className
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  const percentage = Math.min((animatedValue / max) * 100, 100);
  const displayValue = Math.round(percentage);

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-3">
          {label && (
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={cn(
              "text-sm font-semibold transition-all duration-500",
              "text-gradient"
            )}>
              {displayValue}%
            </span>
          )}
        </div>
      )}
      
      {/* Progress Bar Container */}
      <div className={cn(
        "relative overflow-hidden transition-all duration-300",
        {
          'h-2 rounded-full': size === 'sm',
          'h-3 rounded-xl': size === 'md',
          'h-4 rounded-xl': size === 'lg'
        },
        {
          'glass-subtle': variant === 'glass',
          'neomorph-inset': variant === 'neomorph',
          'bg-muted': variant === 'gradient' || variant === 'solid'
        }
      )}>
        {/* Progress Bar */}
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-out relative overflow-hidden",
            {
              'gradient-primary': variant === 'gradient',
              'bg-primary': variant === 'solid',
              'glass': variant === 'glass',
              'gradient-accent neomorph': variant === 'neomorph'
            },
            size === 'sm' ? 'rounded-full' : 'rounded-xl'
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer Effect */}
          {animated && percentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full animate-shimmer" />
          )}
          
          {/* Glow Effect */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-500",
            "bg-gradient-to-r from-primary/20 via-primary/40 to-purple-500/20",
            percentage > 80 ? "opacity-100" : "opacity-0"
          )} />
        </div>
        
        {/* Completion Celebration */}
        {percentage >= 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 animate-pulse-glow rounded-xl" />
        )}
      </div>
      
      {/* Milestone Markers */}
      {size === 'lg' && (
        <div className="flex justify-between mt-2">
          {[25, 50, 75, 100].map((milestone) => (
            <div
              key={milestone}
              className={cn(
                "w-1 h-2 rounded-full transition-all duration-500",
                percentage >= milestone ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
