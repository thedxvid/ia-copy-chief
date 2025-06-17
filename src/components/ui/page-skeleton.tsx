
import React from 'react';
import { Skeleton } from './loading-skeleton';

export const PageSkeleton = () => (
  <div className="space-y-4 p-4 animate-fade-in">
    {/* Header skeleton otimizado */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-72" />
    </div>
    
    {/* Actions bar skeleton */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-8 w-24" />
    </div>
    
    {/* Content grid skeleton otimizado */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="modern-card space-y-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ChatPageSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 space-y-4 animate-fade-in">
    {/* Header */}
    <div className="text-center space-y-2">
      <Skeleton className="h-6 w-48 mx-auto" />
      <Skeleton className="h-3 w-72 mx-auto" />
    </div>
    
    {/* Agent selector */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-8 w-24" />
    </div>
    
    {/* Agent info card */}
    <div className="modern-card p-4">
      <div className="flex items-start space-x-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
    
    {/* Chat area */}
    <div className="modern-card h-[400px] p-4">
      <div className="space-y-4">
        <div className="text-center">
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);
