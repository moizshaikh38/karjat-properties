import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
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
    <div className={`flex items-center gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)] overflow-x-auto ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center px-3 py-1.5 text-[12px] font-medium rounded-[4px] transition-colors whitespace-nowrap cursor-pointer select-none
              ${isActive ? 'text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_1px_2px_0_rgba(0,0,0,0.15)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-transparent'}
            `}
          >
            {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`ml-1.5 px-1 rounded text-[10px] ${isActive ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
