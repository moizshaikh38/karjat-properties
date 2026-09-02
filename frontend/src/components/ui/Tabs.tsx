import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '', fullWidth = false }) => {
  return (
    <div className={`flex items-center p-1 bg-surface-elevated rounded-lg border border-border overflow-x-auto ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
              ${isActive ? 'text-primary bg-surface shadow-sm' : 'text-text-muted hover:text-text hover:bg-surface/50'}
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
