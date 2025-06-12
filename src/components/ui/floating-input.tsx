
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  variant?: 'glass' | 'neomorph' | 'minimal';
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  realTimeValidation?: (value: string) => string | null;
  onChange?: (value: string, isValid: boolean) => void;
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ 
    className, 
    label, 
    error, 
    success,
    helperText,
    variant = 'glass',
    icon,
    showPasswordToggle = false,
    realTimeValidation,
    onChange,
    type = 'text',
    ...props 
  }, ref) => {
    const [value, setValue] = useState(props.value || '');
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const actualRef = ref || inputRef;

    useEffect(() => {
      if (realTimeValidation && value) {
        const validationResult = realTimeValidation(value.toString());
        setValidationError(validationResult);
        setIsValid(!validationResult);
      } else {
        setValidationError(null);
        setIsValid(false);
      }
    }, [value, realTimeValidation]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      if (onChange) {
        const isValidValue = !realTimeValidation || !realTimeValidation(newValue);
        onChange(newValue, isValidValue);
      }
    };

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const hasValue = value && value.toString().length > 0;
    const shouldShowLabel = isFocused || hasValue;
    const finalError = error || validationError;
    const showSuccess = success || (isValid && !finalError);
    const inputType = showPasswordToggle && type === 'password' 
      ? (isPasswordVisible ? 'text' : 'password') 
      : type;

    return (
      <div className={cn("floating-input group", className)}>
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 transition-colors duration-200 group-focus-within:text-primary">
              {icon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={actualRef}
            type={inputType}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=" "
            className={cn(
              "peer w-full transition-all duration-300 placeholder-transparent focus:outline-none touch-target",
              "pt-6 pb-2 text-base",
              {
                'px-4': !icon,
                'pl-10 pr-4': icon && !showPasswordToggle,
                'pl-10 pr-12': icon && showPasswordToggle,
                'pl-4 pr-12': !icon && showPasswordToggle,
              },
              {
                'glass-card border-0 focus:ring-2 focus:ring-primary/30': variant === 'glass',
                'neomorph-inset border-0 focus:shadow-lg': variant === 'neomorph',
                'bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20': variant === 'minimal'
              },
              finalError && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
              showSuccess && "border-green-500 focus:border-green-500 focus:ring-green-500/30"
            )}
            {...props}
          />
          
          {/* Floating Label */}
          <label
            className={cn(
              "absolute pointer-events-none transition-all duration-300 origin-left",
              "text-muted-foreground",
              {
                'left-4': !icon,
                'left-10': icon,
              },
              shouldShowLabel 
                ? "top-2 text-xs scale-90 text-primary" 
                : "top-1/2 -translate-y-1/2 text-base",
              finalError && shouldShowLabel && "text-red-500",
              showSuccess && shouldShowLabel && "text-green-500"
            )}
          >
            {label}
          </label>
          
          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 touch-target"
            >
              {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          
          {/* Validation Icons */}
          {!showPasswordToggle && (finalError || showSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {finalError ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500 animate-scale-in" />
              )}
            </div>
          )}
          
          {/* Focus Ring Effect */}
          <div 
            className={cn(
              "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-r from-primary/10 via-transparent to-purple-500/10",
              isFocused && "opacity-100"
            )}
          />
        </div>
        
        {/* Helper Text / Error Message */}
        {(finalError || helperText) && (
          <div className={cn(
            "mt-2 text-sm transition-all duration-300 animate-fade-in-up",
            finalError ? "text-red-500" : "text-muted-foreground"
          )}>
            {finalError || helperText}
          </div>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
