import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium tracking-tight transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-45 disabled:pointer-events-none rounded-[6px] select-none cursor-pointer';
    
    const variants = {
      primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-hover)] shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]',
      secondary: 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]/50',
      outline: 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
      ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]',
      danger: 'bg-[var(--color-status-hot)]/10 text-[var(--color-status-hot)] border border-[var(--color-status-hot)]/30 hover:bg-[var(--color-status-hot)]/20',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-[12px] gap-1.5',
      md: 'h-9 px-3.5 text-[13px] gap-2',
      lg: 'h-10 px-5 text-[14px] gap-2.5',
    };

    const classes = `
      ${baseStyles}
      ${variants[variant]}
      ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {!isLoading && leftIcon && <span>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
