import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns/config/templates');
      setTemplates(res.data?.data || []);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/campaigns/config/templates/sync');
      toast.success('Templates synced from Fast2SMS');
      fetchTemplates();
    } catch {
      toast.error('Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Approved WhatsApp Templates
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Meta & Fast2SMS pre-approved message templates for outbound broadcasts and notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            isLoading={syncing}
            leftIcon={<RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />}
          >
            Sync from Fast2SMS
          </Button>
        </div>
      </div>

      {/* TEMPLATE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] animate-pulse"></div>
          ))
        ) : templates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[12px] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface)]">
            No templates found. Click "Sync from Fast2SMS" to fetch approved templates.
          </div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.name || tpl.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium font-mono text-[13px] text-[var(--color-text)] truncate">
                    {tpl.name}
                  </h3>
                  <Badge variant="success" size="sm">
                    Approved
                  </Badge>
                </div>

                <div className="p-2.5 bg-[var(--color-surface-elevated)]/60 rounded-[4px] border border-[var(--color-border)] text-[12px] text-[var(--color-text-muted)] leading-relaxed italic">
                  "{tpl.body || tpl.text || 'Namaskar! Explore our verified luxury villas in Karjat.'}"
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
                <span className="capitalize">{tpl.category || 'Marketing'}</span>
                <span className="font-mono">{tpl.language || 'English (en)'}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
