import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { EmptyState } from './ui';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-text-muted hover:text-text hover:bg-surface-elevated transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-lg border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-elevated">
            <h3 className="text-sm font-semibold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
                Mark all as read
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            <EmptyState
              icon={<BellOff className="h-6 w-6" />}
              title="No new notifications"
              description="You're all caught up! Check back later for updates."
              className="border-none rounded-none py-10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
