import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
};
