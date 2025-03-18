import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    helperText, 
    error, 
    className = '', 
    leftIcon, 
    rightIcon,
    fullWidth = true,
    id,
    ...props 
  }, ref) => {
    // Generate a unique ID if one is not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    const baseInputClasses = 'px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors';
    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-400' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-400';
    
    const iconClasses = {
      withLeftIcon: leftIcon ? 'pl-10' : '',
      withRightIcon: rightIcon ? 'pr-10' : ''
    };
    
    const widthClasses = fullWidth ? 'w-full' : '';
    
    const inputClasses = `
      ${baseInputClasses}
      ${errorClasses}
      ${iconClasses.withLeftIcon}
      ${iconClasses.withRightIcon}
      ${widthClasses}
      ${className}
    `;
    
    return (
      <div className={`${widthClasses}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;