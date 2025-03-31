// src/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  className = '',
  ...props
}) => {
  const id = props.id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  const inputClasses = `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
    ${error 
      ? 'border-red-300 focus:border-red-300 focus:ring-red-200' 
      : 'border-gray-300 focus:border-primary-300 focus:ring-primary-200'
    }
    ${props.disabled ? 'bg-gray-100 text-gray-500' : ''}
    ${className}
  `;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <input
        id={id}
        className={inputClasses}
        {...props}
      />
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;