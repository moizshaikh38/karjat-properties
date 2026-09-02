import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  noPadding = false,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden ${
        hoverable ? 'transition-colors hover:border-[var(--color-border)]/80 hover:bg-[var(--color-surface-elevated)]/30' : ''
      } ${className}`}
      {...props}
    >
      {header && <div className="px-4 py-3 border-b border-[var(--color-border)] text-[14px] font-medium text-[var(--color-text)]">{header}</div>}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
      {footer && <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[13px] text-[var(--color-text-muted)]">{footer}</div>}
    </div>
  );
};
