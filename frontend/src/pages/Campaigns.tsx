import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, BarChart2, Calendar, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface Campaign {
  id: string;
  name: string;
  template_name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  audience_filter: any;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  replied_count: number;
  failed_count: number;
  scheduled_at: string | null;
  created_at: string;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/campaigns');
      const raw = response.data?.data;
      const list = raw?.campaigns || (Array.isArray(raw) ? raw : []);
      setCampaigns(list);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col h-full bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            WhatsApp Broadcast Campaigns
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Broadcast verified Karjat projects, weekend site-visit invitations, and price updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCampaigns} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/campaigns/new')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Broadcast
          </Button>
        </div>
      </div>

      {/* DENSE TABLE */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                <th className="py-2.5 px-4 font-medium">Campaign Name</th>
                <th className="py-2.5 px-4 font-medium">Template</th>
                <th className="py-2.5 px-4 font-medium">Recipients</th>
                <th className="py-2.5 px-4 font-medium">Delivery Stats (Sent / Delivered / Read)</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 text-right font-medium">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-36"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-28"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-48"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[12px] text-[var(--color-text-muted)]">
                    No WhatsApp campaigns launched yet. Click "New Broadcast" to start.
                  </td>
                </tr>
              ) : (
                campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--color-surface-elevated)]/40 transition-colors">
                    <td className="py-3 px-4 font-medium font-display text-[14px] text-[var(--color-text)]">
                      {c.name}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-text-muted)]">
                      {c.template_name || 'project_launch_karjat'}
                    </td>

                    <td className="py-3 px-4 font-mono text-[12px] text-[var(--color-text)] tabular-nums">
                      {c.total_recipients || 0}
                    </td>

                    <td className="py-3 px-4 text-[12px] font-mono tabular-nums text-[var(--color-text-muted)]">
                      <span className="text-[var(--color-text)]">{c.sent_count || 0}</span> sent · <span className="text-[var(--color-accent)]">{c.delivered_count || 0}</span> deliv · <span className="text-[var(--color-status-warm)]">{c.read_count || 0}</span> read
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={c.status === 'sent' ? 'success' : c.status === 'sending' ? 'warm' : 'default'}>
                        {c.status || 'Draft'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right text-[11px] text-[var(--color-text-muted)] tabular-nums">
                      {c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
