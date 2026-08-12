import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  let baseStyles = 'px-6 py-3 rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  if (variant === 'primary') {
    baseStyles += ' glass-button text-white';
  } else if (variant === 'secondary') {
    baseStyles += ' glass-button-secondary text-slate-200 hover:text-white';
  } else if (variant === 'danger') {
    baseStyles += ' bg-rose-600/80 hover:bg-rose-600 border border-rose-500/30 text-white shadow-lg shadow-rose-600/20';
  } else if (variant === 'ghost') {
    baseStyles += ' bg-transparent hover:bg-white/5 text-slate-300 hover:text-white';
  }

  if (fullWidth) {
    baseStyles += ' w-full';
  }

  return (
    <button className={`${baseStyles} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
