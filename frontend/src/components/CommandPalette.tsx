import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Building2, Users, Layers, MessageSquare, Calendar, PhoneCall, Megaphone, FileText, Bot, Zap, BarChart3, Users2, Settings } from 'lucide-react';
import api from '../services/api';

interface SearchResult {
  id: string;
  type: 'lead' | 'property' | 'page';
  title: string;
  subtitle?: string;
  url: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = [
    { id: 'nav-dashboard', type: 'page' as const, title: 'Overview Dashboard', url: '/dashboard' },
    { id: 'nav-inbox', type: 'page' as const, title: 'WhatsApp Live Inbox', url: '/inbox' },
    { id: 'nav-properties', type: 'page' as const, title: 'Properties Catalog', url: '/properties' },
    { id: 'nav-leads', type: 'page' as const, title: 'Buyer Leads Database', url: '/leads' },
    { id: 'nav-pipeline', type: 'page' as const, title: 'Sales Pipeline (Kanban)', url: '/pipeline' },
    { id: 'nav-site-visits', type: 'page' as const, title: 'Site Visit Coordinator', url: '/site-visits' },
    { id: 'nav-follow-ups', type: 'page' as const, title: 'Follow-up Sequences', url: '/followups' },
    { id: 'nav-campaigns', type: 'page' as const, title: 'WhatsApp Campaigns', url: '/campaigns' },
    { id: 'nav-templates', type: 'page' as const, title: 'Message Templates', url: '/templates' },
    { id: 'nav-ai-agent', type: 'page' as const, title: 'AI Sales Agent Engine', url: '/ai' },
    { id: 'nav-automation', type: 'page' as const, title: 'Automation & Smart Triggers', url: '/automation' },
    { id: 'nav-analytics', type: 'page' as const, title: 'Performance Analytics', url: '/analytics' },
    { id: 'nav-team', type: 'page' as const, title: 'Team & Agents Management', url: '/team' },
    { id: 'nav-settings', type: 'page' as const, title: 'System Settings', url: '/settings' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(pages.map(p => ({ ...p, subtitle: 'Navigation' })));
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setResults(pages.map(p => ({ ...p, subtitle: 'Navigation' })));
      return;
    }

    const filteredPages = pages
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ ...p, subtitle: 'Navigation' }));

    setResults(filteredPages);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div 
        className="fixed inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      <div 
        className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-[0_16px_48px_rgba(0,0,0,0.4)] w-full max-w-lg overflow-hidden flex flex-col z-10"
      >
        <div className="flex items-center px-3.5 border-b border-[var(--color-border)]">
          <Search className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search pages..."
            className="w-full bg-transparent px-3 py-3 text-[13px] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-[var(--color-border)]/20 hide-scrollbar">
          {results.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[var(--color-text-muted)]">
              No matching commands or pages found.
            </div>
          ) : (
            results.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`flex items-center justify-between px-3 py-2 rounded-[4px] cursor-pointer text-[13px] transition-colors ${
                  index === selectedIndex
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]/50'
                }`}
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{item.subtitle}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
