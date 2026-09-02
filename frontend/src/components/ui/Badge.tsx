import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', size = 'md' }) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium';
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  
  const variants = {
    default: 'bg-surface-elevated text-text border border-border',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-info/10 text-info border border-info/20',
    primary: 'bg-primary/10 text-primary border border-primary/20',
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
