import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[95vw]',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={`relative bg-[var(--color-surface)] rounded-[6px] shadow-[0_8px_30px_rgb(0,0,0,0.35)] w-full ${maxWidthClasses[maxWidth]} flex flex-col max-h-[90vh] border border-[var(--color-border)]`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)] tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-[4px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors z-10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="p-5 overflow-y-auto flex-1 text-[13px]">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
