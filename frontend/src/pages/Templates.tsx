import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Template {
  id: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: any[];
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/campaigns/config/templates');
      setTemplates(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/campaigns/config/templates/sync');
      toast.success('Templates synced successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  const filteredTemplates = templates.filter(t => filter === 'ALL' || t.category === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">Approved</span>;
      case 'PENDING': return <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full border border-amber-200">Pending</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full border border-red-200">Rejected</span>;
      default: return null;
    }
  };

  const getPreviewText = (components: any[]) => {
    const bodyComp = components?.find(c => c.type === 'BODY');
    return bodyComp?.text || 'No body content available';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Message Templates</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Templates'}
        </button>
      </div>

      <div className="flex space-x-2 mb-6">
        {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--color-surface)] h-48 rounded-xl border border-[var(--color-border)]"></div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <LayoutGrid className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No templates found</h3>
          <p className="text-[var(--color-text-muted)]">Try syncing with WhatsApp to fetch the latest templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id || template.name} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-[var(--color-text)] break-all">{template.name}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-[var(--color-text-muted)] uppercase bg-[var(--color-bg)] px-1.5 py-0.5 rounded">
                      {template.language}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] uppercase">
                      {template.category}
                    </span>
                  </div>
                </div>
                {getStatusBadge(template.status)}
              </div>
              
              <div className="flex-1 bg-[var(--color-bg)] rounded-lg p-3 border border-[var(--color-border)] relative">
                <MessageSquare className="absolute top-3 right-3 w-4 h-4 text-[var(--color-border)]" />
                <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap pr-6 line-clamp-4">
                  {getPreviewText(template.components)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
