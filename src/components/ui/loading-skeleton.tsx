
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', width, height, lines = 1, ...props }, ref) => {
    if (variant === 'text' && lines > 1) {
      return (
        <div className="space-y-2 animate-fade-in" ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "skeleton h-3 bg-[#2A2A2A] rounded animate-pulse",
                index === lines - 1 && "w-3/4",
                className
              )}
              style={{
                width: index === lines - 1 ? '75%' : width,
                height: height || '0.75rem'
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "skeleton bg-[#2A2A2A] animate-pulse",
          {
            'h-3 w-full': variant === 'text',
            'rounded-full': variant === 'circular',
            'rounded-lg': variant === 'rectangular' || variant === 'default'
          },
          className
        )}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Skeleton otimizado para cards
export const CardSkeleton = () => (
  <div className="modern-card space-y-3 animate-fade-in">
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width={32} height={32} />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" lines={2} />
    <div className="flex justify-between">
      <Skeleton width={60} height={24} />
      <Skeleton width={80} height={24} />
    </div>
  </div>
);

export const TextSkeleton = ({ lines = 2 }: { lines?: number }) => (
  <div className="space-y-2 animate-fade-in">
    <Skeleton variant="text" lines={lines} />
  </div>
);

export const ButtonSkeleton = () => (
  <Skeleton width={100} height={36} className="rounded-lg" />
);
