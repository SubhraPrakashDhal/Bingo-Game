import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' | 'rose' | 'cyan' | 'indigo' | 'fuchsia' | 'teal';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'blue', className = '' }) => {
  const variantStyles = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
