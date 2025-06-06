
import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils';

const modernButtonVariants = cva(
  "modern-button relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed transform-gpu",
  {
    variants: {
      variant: {
        default: "gradient-primary text-white shadow-lg hover:shadow-xl",
        secondary: "bg-secondary/80 backdrop-blur-sm text-secondary-foreground border border-border/50 hover:bg-secondary hover:shadow-lg",
        outline: "border-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground backdrop-blur-sm",
        ghost: "text-foreground hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm",
        gradient: "gradient-accent text-white shadow-lg hover:shadow-xl",
        warm: "gradient-warm text-white shadow-lg hover:shadow-xl",
        glass: "glass text-foreground hover:bg-white/10",
        neomorph: "neomorph text-foreground hover:shadow-lg"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ModernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const buttonContent = (
      <>
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-700 pointer-events-none group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </div>
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Content */}
        <span className={cn("relative z-10 flex items-center gap-2", loading && "opacity-0")}>
          {children}
        </span>
        
        {/* Ripple effect container */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="ripple-container" />
        </div>
      </>
    );

    if (asChild) {
      return (
        <Slot
          className={cn(modernButtonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          {React.cloneElement(children as React.ReactElement, {
            disabled: disabled || loading,
          }, buttonContent)}
        </Slot>
      );
    }
    
    return (
      <button
        className={cn(modernButtonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

ModernButton.displayName = "ModernButton";

export { ModernButton, modernButtonVariants };
