import React from 'react';

export type BadgeVariant = 'default' | 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', size = 'sm' }) => {
  const baseStyles = 'inline-flex items-center font-medium tracking-tight rounded-[4px] border';
  
  const sizes = {
    sm: 'px-1.5 py-0.5 text-[11px] leading-tight',
    md: 'px-2 py-0.5 text-[12px] leading-tight',
  };
  
  const variants = {
    default: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]',
    hot: 'bg-[var(--color-status-hot)]/10 text-[var(--color-status-hot)] border-[var(--color-status-hot)]/25',
    warm: 'bg-[var(--color-status-warm)]/10 text-[var(--color-status-warm)] border-[var(--color-status-warm)]/25',
    cold: 'bg-[var(--color-status-cold)]/10 text-[var(--color-status-cold)] border-[var(--color-status-cold)]/25',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25',
    danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25',
    info: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25',
    primary: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/25',
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
