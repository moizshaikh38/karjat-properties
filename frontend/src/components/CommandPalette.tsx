import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Building, Users } from 'lucide-react';
import { Modal } from './ui';
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
    { id: 'nav-dashboard', type: 'page' as const, title: 'Dashboard', url: '/' },
    { id: 'nav-inbox', type: 'page' as const, title: 'Inbox', url: '/inbox' },
    { id: 'nav-leads', type: 'page' as const, title: 'Leads', url: '/leads' },
    { id: 'nav-properties', type: 'page' as const, title: 'Properties', url: '/properties' },
    { id: 'nav-site-visits', type: 'page' as const, title: 'Site Visits', url: '/site-visits' },
    { id: 'nav-follow-ups', type: 'page' as const, title: 'Follow-ups', url: '/follow-ups' },
    { id: 'nav-campaigns', type: 'page' as const, title: 'Campaigns', url: '/campaigns' },
    { id: 'nav-templates', type: 'page' as const, title: 'Templates', url: '/templates' },
    { id: 'nav-ai-agent', type: 'page' as const, title: 'AI Agent', url: '/ai' },
    { id: 'nav-analytics', type: 'page' as const, title: 'Analytics', url: '/analytics' },
    { id: 'nav-settings', type: 'page' as const, title: 'Settings', url: '/settings' },
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
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setResults(pages.map(p => ({ ...p, subtitle: 'Navigation' })));
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Fallback search in pages
        const filteredPages = pages
          .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
          .map(p => ({ ...p, subtitle: 'Navigation' }));

        // Attempt to fetch from APIs (if they exist, ignore errors gracefully for now)
        let remoteResults: SearchResult[] = [];
        try {
          const [leadsRes, propsRes] = await Promise.all([
            api.get(`/api/leads/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: { data: [] } })),
            api.get(`/api/properties/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: { data: [] } }))
          ]);
          
          const leads = (leadsRes.data?.data || []).map((l: any) => ({
            id: `lead-${l.id}`,
            type: 'lead' as const,
            title: l.name,
            subtitle: l.email || l.phone,
            url: `/leads/${l.id}`
          }));
          
          const properties = (propsRes.data?.data || []).map((p: any) => ({
            id: `prop-${p.id}`,
            type: 'property' as const,
            title: p.title,
            subtitle: p.location,
            url: `/properties/${p.id}`
          }));
          
          remoteResults = [...leads, ...properties];
        } catch (e) {
          console.error("Search error", e);
        }

        setResults([...filteredPages, ...remoteResults]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        navigate(results[selectedIndex].url);
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate]);

  return (
    <>
      {/* Invisible global trigger listener, the visual button is rendered in TopBar */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="lg">
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-text-muted mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none text-text placeholder-text-muted"
            placeholder="Search leads, properties, or navigate... (Cmd+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-text-muted" />}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-center text-sm text-text-muted">No results found.</div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => {
                  navigate(result.url);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-md transition-colors ${
                  index === selectedIndex ? 'bg-surface-elevated text-text' : 'text-text-muted hover:bg-surface-elevated/50'
                }`}
              >
                <div className="mr-3 p-1.5 rounded bg-surface border border-border">
                  {result.type === 'page' ? <Search className="h-4 w-4" /> : 
                   result.type === 'lead' ? <Users className="h-4 w-4" /> : 
                   <Building className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-text">{result.title}</div>
                  <div className="text-xs text-text-muted">{result.subtitle}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};
