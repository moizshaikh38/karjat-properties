import React, { useState, useEffect } from 'react';
import { format, isToday, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface SiteVisit {
  id: string;
  lead_id: string;
  property_id: string;
  scheduled_date: string;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  agent_notes: string;
  lead: { name: string; phone: string };
  property: { name: string };
}

export default function SiteVisits() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/site-visits');
      const raw = response.data?.data;
      const list = raw?.siteVisits || (Array.isArray(raw) ? raw : []);
      setVisits(list);
    } catch {
      toast.error('Failed to load site visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleAction = async (id: string, action: 'schedule' | 'cancel' | 'complete') => {
    setActionLoading(id);
    try {
      await api.post(`/site-visits/${id}/${action}`);
      toast.success(`Site visit marked as ${action}d`);
      fetchVisits();
    } catch (error) {
      toast.error(`Failed to update visit status`);
    } finally {
      setActionLoading(null);
    }
  };

  const visitList = Array.isArray(visits) ? visits : [];
  const filteredVisits = visitList.filter(visit => {
    const date = visit.scheduled_date ? new Date(visit.scheduled_date) : null;
    if (activeTab === 'Today') return date && isToday(date);
    if (activeTab === 'Upcoming') return date && isFuture(date) && ['requested', 'scheduled'].includes(visit.status);
    if (activeTab === 'Completed') return visit.status === 'completed';
    if (activeTab === 'Cancelled') return visit.status === 'cancelled';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col h-full bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Site Visit Coordinator
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Manage weekend customer appointments, slot confirmations, and Karjat executive assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchVisits} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* SEGMENTED FILTER TABS */}
      <div className="flex gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)] w-fit mb-4">
        {['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'].map(tab => (
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

      {/* DENSE VISITS TABLE */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                <th className="py-2.5 px-4 font-medium">Customer / Phone</th>
                <th className="py-2.5 px-4 font-medium">Scheduled Property</th>
                <th className="py-2.5 px-4 font-medium">Date & Time</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Notes</th>
                <th className="py-2.5 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-28"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-36"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-24"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[12px] text-[var(--color-text-muted)]">
                    No site visits found for this filter.
                  </td>
                </tr>
              ) : (
                filteredVisits.map(visit => {
                  const visitDate = visit.scheduled_date ? new Date(visit.scheduled_date) : null;
                  
                  return (
                    <tr key={visit.id} className="hover:bg-[var(--color-surface-elevated)]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--color-text)]">
                          {visit.lead?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          {visit.lead?.phone}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-display font-medium text-[var(--color-text)]">
                        {visit.property?.name || 'Karjat Villa Project'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[var(--color-text)] tabular-nums">
                          {visitDate ? format(visitDate, 'MMM d, yyyy') : 'TBD'}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] font-mono tabular-nums">
                          {visitDate ? format(visitDate, 'hh:mm a') : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge 
                          variant={
                            visit.status === 'completed' ? 'success' :
                            visit.status === 'scheduled' ? 'warm' :
                            visit.status === 'requested' ? 'hot' : 'cold'
                          }
                        >
                          {visit.status || 'Requested'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-[12px] text-[var(--color-text-muted)] max-w-xs truncate">
                        {visit.agent_notes || 'Self-drive direct to site'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {visit.status === 'requested' && (
                            <button
                              onClick={() => handleAction(visit.id, 'schedule')}
                              disabled={actionLoading === visit.id}
                              className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded-[4px] text-[11px] font-medium hover:bg-[var(--color-accent)]/20 cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          {visit.status === 'scheduled' && (
                            <button
                              onClick={() => handleAction(visit.id, 'complete')}
                              disabled={actionLoading === visit.id}
                              className="px-2 py-0.5 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30 rounded-[4px] text-[11px] font-medium hover:bg-[var(--color-success)]/20 cursor-pointer"
                            >
                              Done
                            </button>
                          )}
                          {['requested', 'scheduled'].includes(visit.status) && (
                            <button
                              onClick={() => handleAction(visit.id, 'cancel')}
                              disabled={actionLoading === visit.id}
                              className="px-2 py-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-status-hot)] rounded-[4px] text-[11px] font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
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
