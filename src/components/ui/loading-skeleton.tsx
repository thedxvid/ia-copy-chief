
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
        <div className="space-y-2" ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "skeleton h-4",
                index === lines - 1 && "w-3/4", // Last line shorter
                className
              )}
              style={{
                width: index === lines - 1 ? '75%' : width,
                height: height || '1rem'
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
          "skeleton",
          {
            'h-4 w-full': variant === 'text',
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

// Pre-built skeleton layouts
export const CardSkeleton = () => (
  <div className="modern-card space-y-4">
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" lines={3} />
    <div className="flex justify-between">
      <Skeleton width={80} height={32} />
      <Skeleton width={120} height={32} />
    </div>
  </div>
);

export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    <Skeleton variant="text" lines={lines} />
  </div>
);

export const ButtonSkeleton = () => (
  <Skeleton width={120} height={48} className="rounded-xl" />
);
