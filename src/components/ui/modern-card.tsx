
import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'neomorph' | 'elevated' | 'minimal';
  interactive?: boolean;
  children: React.ReactNode;
}

export const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant = 'glass', interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-300 rounded-xl",
          {
            'glass-card': variant === 'glass',
            'bg-[#1E1E1E] border border-[#4B5563]/50 rounded-xl p-6': variant === 'neomorph',
            'bg-[#1E1E1E] border border-[#4B5563]/50 rounded-xl p-6 shadow-lg hover:shadow-xl': variant === 'elevated',
            'bg-[#1E1E1E]/80 backdrop-blur-sm border border-[#4B5563]/30 rounded-xl p-6': variant === 'minimal'
          },
          interactive && "interactive cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:border-[#3B82F6]/50",
          className
        )}
        {...props}
      >
        {/* Glow effect on hover */}
        {interactive && (
          <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6]/10 via-transparent to-[#2563EB]/10" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10 text-white">
          {children}
        </div>
        
        {/* Shine effect */}
        {interactive && (
          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        )}
      </div>
    );
  }
);

ModernCard.displayName = "ModernCard";
