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
      className={`bg-surface border border-border rounded-lg overflow-hidden ${
        hoverable ? 'transition-shadow hover:shadow-md hover:border-primary/50' : ''
      } ${className}`}
      {...props}
    >
      {header && <div className="px-6 py-4 border-b border-border">{header}</div>}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
      {footer && <div className="px-6 py-4 border-t border-border bg-surface-elevated">{footer}</div>}
    </div>
  );
};
