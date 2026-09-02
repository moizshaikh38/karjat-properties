import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, BarChart2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sending': return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'sent': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Campaigns</h1>
        <Link
          to="/campaigns/new"
          className="flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--color-surface)] h-24 rounded-xl border border-[var(--color-border)]"></div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <Megaphone className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No campaigns yet</h3>
          <p className="text-[var(--color-text-muted)] mb-6">Create your first broadcast campaign to engage your leads.</p>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Campaign</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Performance</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-[var(--color-bg)] transition-colors cursor-pointer">
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-text)]">{campaign.name}</div>
                    <div className="text-sm text-[var(--color-text-muted)] mt-1">Template: {campaign.template_name}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                      {campaign.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-[var(--color-text)] mb-2">
                      {campaign.sent_count} / {campaign.total_recipients} Sent
                    </div>
                    <div className="flex h-2 bg-[var(--color-bg)] rounded-full overflow-hidden max-w-[200px]">
                      <div className="bg-blue-500" style={{ width: `${(campaign.sent_count / campaign.total_recipients) * 100}%` }}></div>
                      <div className="bg-green-500" style={{ width: `${(campaign.delivered_count / campaign.total_recipients) * 100}%` }}></div>
                    </div>
                    <div className="flex space-x-3 text-xs text-[var(--color-text-muted)] mt-2">
                      <span title="Delivered">{campaign.delivered_count} D</span>
                      <span title="Read">{campaign.read_count} R</span>
                      <span title="Replied">{campaign.replied_count} Re</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-text-muted)]">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(campaign.created_at), 'MMM d, yyyy')}
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
