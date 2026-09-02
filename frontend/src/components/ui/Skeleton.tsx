import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
}) => {
  const roundedClasses = {
    sm: 'rounded-[3px]',
    md: 'rounded-[6px]',
    lg: 'rounded-[6px]',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/40 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};
