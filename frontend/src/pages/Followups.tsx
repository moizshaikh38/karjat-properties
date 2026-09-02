import React, { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { Calendar, User, Clock, AlertCircle, PhoneCall, RefreshCw, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface Followup {
  id: string;
  lead_id: string;
  conversation_id: string;
  followup_type: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'completed' | 'cancelled' | 'failed';
  lead: { name: string; phone: string };
}

export default function Followups() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/followups');
      const raw = response.data?.data;
      const list = raw?.followups || (Array.isArray(raw) ? raw : []);
      setFollowups(list);
    } catch (error) {
      toast.error('Failed to load follow-up sequences');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/followups/${id}/cancel`);
      toast.success('Follow-up cancelled');
      fetchFollowups();
    } catch (error) {
      toast.error('Failed to cancel follow-up');
    }
  };

  const followupList = Array.isArray(followups) ? followups : [];
  const filteredFollowups = followupList.filter(f => {
    const isOverdue = f.scheduled_at && isPast(new Date(f.scheduled_at)) && f.status === 'pending';
    const isPending = f.scheduled_at && !isPast(new Date(f.scheduled_at)) && f.status === 'pending';

    if (activeTab === 'Pending') return isPending;
    if (activeTab === 'Overdue') return isOverdue;
    if (activeTab === 'Sent') return f.status === 'sent';
    if (activeTab === 'Completed') return f.status === 'completed';
    if (activeTab === 'Cancelled') return f.status === 'cancelled';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col h-full bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Automated Follow-up Sequences
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Timed reminders, site-visit re-engagement, and brochure follow-up triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFollowups} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)] w-fit mb-4">
        {['All', 'Pending', 'Overdue', 'Sent', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DENSE TABLE */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                <th className="py-2.5 px-4 font-medium">Buyer Contact</th>
                <th className="py-2.5 px-4 font-medium">Sequence Type</th>
                <th className="py-2.5 px-4 font-medium">Scheduled Time</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-28"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-32"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-24"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-14 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredFollowups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[12px] text-[var(--color-text-muted)]">
                    No follow-ups scheduled under this filter.
                  </td>
                </tr>
              ) : (
                filteredFollowups.map(f => {
                  const date = f.scheduled_at ? new Date(f.scheduled_at) : null;
                  const isOverdue = date && isPast(date) && f.status === 'pending';

                  return (
                    <tr key={f.id} className="hover:bg-[var(--color-surface-elevated)]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--color-text)]">
                          {f.lead?.name || 'Prospect'}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          {f.lead?.phone}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[12px] text-[var(--color-text)] capitalize">
                        {f.followup_type?.replace(/_/g, ' ') || 'Site Visit Followup'}
                      </td>

                      <td className="py-3 px-4">
                        <div className={`tabular-nums ${isOverdue ? 'text-[var(--color-status-hot)] font-medium' : 'text-[var(--color-text)]'}`}>
                          {date ? format(date, 'MMM d, yyyy') : 'Pending'}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] font-mono tabular-nums">
                          {date ? format(date, 'hh:mm a') : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={isOverdue ? 'hot' : f.status === 'completed' || f.status === 'sent' ? 'success' : 'warm'}>
                          {isOverdue ? 'Overdue' : f.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {f.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(f.id)}
                            className="px-2 py-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-status-hot)] rounded-[4px] text-[11px] font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
