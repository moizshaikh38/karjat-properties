import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, fullWidth = false, options, className = '', disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="block text-[12px] font-medium text-[var(--color-text-muted)] mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`
              appearance-none block w-full rounded-[6px] border text-[var(--color-text)] bg-[var(--color-surface)]
              focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] text-[13px]
              transition-colors cursor-pointer
              ${error ? 'border-[var(--color-status-hot)] focus:ring-[var(--color-status-hot)]' : 'border-[var(--color-border)]'}
              ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--color-surface-elevated)]' : ''}
              h-9 pl-3 pr-8
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[var(--color-text-muted)]">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
        {error && <p className="mt-1 text-[11px] text-[var(--color-status-hot)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
