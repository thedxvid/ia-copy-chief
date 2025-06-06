
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, required, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `floating-input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-1">
        <div className="floating-input">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "peer w-full px-4 pt-6 pb-2 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background/80",
              "transition-all duration-300 placeholder:transparent",
              "hover:border-border hover:bg-background/60",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              className
            )}
            placeholder={label}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-4 top-4 text-muted-foreground transition-all duration-300",
              "pointer-events-none origin-left transform-gpu",
              "peer-focus:text-xs peer-focus:text-primary peer-focus:transform peer-focus:-translate-y-2 peer-focus:scale-90",
              "peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-primary",
              "peer-[:not(:placeholder-shown)]:transform peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-90",
              error && "peer-focus:text-destructive peer-[:not(:placeholder-shown)]:text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        </div>
        {error && (
          <p className="text-sm text-destructive animate-slide-up px-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
