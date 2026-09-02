import React, { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { Calendar, User, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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
      const response = await api.get('/followups');
      const raw = response.data?.data;
      const list = raw?.followups || (Array.isArray(raw) ? raw : []);
      setFollowups(list);
    } catch (error) {
      toast.error('Failed to load followups');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this follow-up?')) return;
    
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Follow-ups</h1>
      </div>

      <div className="flex space-x-1 border-b border-[var(--color-border)] mb-6 overflow-x-auto">
        {['All', 'Pending', 'Overdue', 'Sent', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--color-surface)] h-20 rounded-xl border border-[var(--color-border)]"></div>
          ))}
        </div>
      ) : filteredFollowups.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <AlertCircle className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)] text-lg">No follow-ups scheduled.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Lead</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Type</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Scheduled For</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredFollowups.map(f => (
                <tr key={f.id} className="hover:bg-[var(--color-bg)] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-text)] flex items-center">
                      <User className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                      {f.lead?.name || 'Contact'}
                    </div>
                    <div className="text-sm text-[var(--color-text-muted)] ml-6">{f.lead?.phone || '—'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text)]">
                      {f.followup_type ? f.followup_type.replace(/_/g, ' ') : 'General Follow-up'}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--color-text)]">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-1 text-[var(--color-text-muted)]" />
                      {f.scheduled_at ? format(new Date(f.scheduled_at), 'MMM d, yyyy') : '—'}
                    </div>
                    <div className="flex items-center text-sm text-[var(--color-text-muted)] mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {f.scheduled_at ? format(new Date(f.scheduled_at), 'h:mm a') : '—'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(f.status)}`}>
                      {f.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {f.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(f.id)}
                        className="px-3 py-1.5 text-sm border border-[var(--color-border)] text-red-600 rounded-lg hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
