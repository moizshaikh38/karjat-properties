import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface)] ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] mb-3">
        {icon}
      </div>
      <h3 className="text-[14px] font-medium text-[var(--color-text)] mb-1">{title}</h3>
      {description && <p className="text-[13px] text-[var(--color-text-muted)] max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
