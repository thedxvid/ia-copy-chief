
import React from 'react';
import { Skeleton } from './loading-skeleton';

export const PageSkeleton = () => (
  <div className="space-y-6 p-6 animate-fade-in">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Actions bar skeleton */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* Content grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="modern-card space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ChatPageSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
    {/* Header */}
    <div className="text-center space-y-2">
      <Skeleton className="h-8 w-64 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
    </div>
    
    {/* Agent selector */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* Agent info card */}
    <div className="modern-card p-4">
      <div className="flex items-start space-x-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
    
    {/* Chat area */}
    <div className="modern-card h-[500px] p-4">
      <div className="space-y-4">
        <div className="text-center">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);
