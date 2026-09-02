import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, fullWidth = false, className = '', disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="block text-[12px] font-medium text-[var(--color-text-muted)] mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`
              block w-full rounded-[6px] border text-[var(--color-text)] bg-[var(--color-surface)]
              focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] text-[13px]
              transition-colors
              ${error ? 'border-[var(--color-status-hot)] focus:ring-[var(--color-status-hot)]' : 'border-[var(--color-border)]'}
              ${icon ? 'pl-8' : 'pl-3'}
              ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--color-surface-elevated)]' : ''}
              h-9 pr-3
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-[11px] text-[var(--color-status-hot)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
