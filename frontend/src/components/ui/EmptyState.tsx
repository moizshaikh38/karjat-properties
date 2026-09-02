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
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-lg bg-surface/50 ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-elevated text-text-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
