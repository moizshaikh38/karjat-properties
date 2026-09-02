import React, { useState, useEffect } from 'react';
import { format, isToday, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVisits = async () => {
    try {
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
    if (!window.confirm(`Are you sure you want to ${action} this visit?`)) return;
    
    setActionLoading(id);
    try {
      await api.post(`/site-visits/${id}/${action}`);
      toast.success(`Visit ${action}d successfully`);
      fetchVisits();
    } catch (error) {
      toast.error(`Failed to ${action} visit`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Site Visits</h1>
      </div>

      <div className="flex space-x-1 border-b border-[var(--color-border)] mb-6">
        {['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
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
            <div key={i} className="animate-pulse bg-[var(--color-surface)] h-24 rounded-xl border border-[var(--color-border)]"></div>
          ))}
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <Calendar className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)] text-lg">No site visits found.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Customer</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Property</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Date & Time</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredVisits.map(visit => (
                <tr key={visit.id} className="hover:bg-[var(--color-bg)] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-text)] flex items-center">
                      <User className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                      {visit.lead?.name || 'Contact'}
                    </div>
                    <div className="text-sm text-[var(--color-text-muted)] ml-6">{visit.lead?.phone || '—'}</div>
                  </td>
                  <td className="p-4 text-[var(--color-text)]">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                      {visit.property?.name || 'Karjat Property'}
                    </div>
                  </td>
                  <td className="p-4 text-[var(--color-text)]">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-1 text-[var(--color-text-muted)]" />
                      {visit.scheduled_date ? format(new Date(visit.scheduled_date), 'MMM d, yyyy') : '—'}
                    </div>
                    <div className="flex items-center text-sm text-[var(--color-text-muted)] mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {visit.scheduled_date ? format(new Date(visit.scheduled_date), 'h:mm a') : '—'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {visit.status === 'requested' && (
                        <button
                          onClick={() => handleAction(visit.id, 'schedule')}
                          disabled={actionLoading === visit.id}
                          className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                          Schedule
                        </button>
                      )}
                      {visit.status === 'scheduled' && (
                        <button
                          onClick={() => handleAction(visit.id, 'complete')}
                          disabled={actionLoading === visit.id}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                      {(visit.status === 'requested' || visit.status === 'scheduled') && (
                        <button
                          onClick={() => handleAction(visit.id, 'cancel')}
                          disabled={actionLoading === visit.id}
                          className="px-3 py-1.5 text-sm border border-[var(--color-border)] text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
