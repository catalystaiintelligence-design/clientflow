import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-primary-500 hover:bg-primary-600 text-white shadow-sm border border-primary-600',
  secondary: 'bg-white hover:bg-gray-50 text-sf-slate border border-sf-border shadow-sm',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-red-700',
  ghost:     'hover:bg-gray-100 text-sf-muted border border-transparent',
  success:   'bg-sf-success hover:bg-green-700 text-white shadow-sm border border-green-700',
  outline:   'bg-transparent hover:bg-primary-50 text-primary-500 border border-primary-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded font-medium
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
