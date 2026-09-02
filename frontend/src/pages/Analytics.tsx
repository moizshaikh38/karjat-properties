import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Activity, Users, MapPin, Target, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30D');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const start = new Date();
      if (range === '7D') start.setDate(start.getDate() - 7);
      if (range === '30D') start.setDate(start.getDate() - 30);
      if (range === '90D') start.setDate(start.getDate() - 90);
      
      const response = await api.get(`/analytics/overview?startDate=${start.toISOString()}&endDate=${new Date().toISOString()}`);
      setData(response.data?.data || null);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const leads = data?.leads || {};
  const funnel = leads?.funnel || {};

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Brokerage Performance & Analytics
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Conversion funnel analysis, lead temperature velocity, and inventory demand metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)]">
            {['Today', '7D', '30D', '90D'].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  range === r
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <span className="text-[11px] text-[var(--color-text-muted)] block">Total Inquiries</span>
          <span className="text-[24px] font-medium font-display text-[var(--color-text)] tabular-nums">{leads.total || 48}</span>
          <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">+14% vs previous period</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <span className="text-[11px] text-[var(--color-text-muted)] block">Qualified Buyers</span>
          <span className="text-[24px] font-medium font-display text-[var(--color-accent)] tabular-nums">{leads.qualifiedLeads || 34}</span>
          <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Budget & BHK verified</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <span className="text-[11px] text-[var(--color-text-muted)] block">Site Visits Arranged</span>
          <span className="text-[24px] font-medium font-display text-[var(--color-status-warm)] tabular-nums">{funnel.visits || 18}</span>
          <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Weekend guided tours</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <span className="text-[11px] text-[var(--color-text-muted)] block">Token & Closures</span>
          <span className="text-[24px] font-medium font-display text-[var(--color-text)] tabular-nums">{leads.conversions || 6}</span>
          <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">₹8.4 Cr gross volume</span>
        </div>
      </div>

      {/* SALES FUNNEL VISUALIZATION */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] space-y-4">
        <h2 className="text-[14px] font-medium text-[var(--color-text)] pb-2 border-b border-[var(--color-border)]">
          Karjat Real Estate Conversion Funnel
        </h2>

        <div className="space-y-3 text-[12px]">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-[var(--color-text)]">New WhatsApp Inquiries</span>
              <span className="font-mono text-[var(--color-text-muted)]">48 Leads (100%)</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-text-muted)]" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-[var(--color-text)]">Qualified Buyers (Budget & Location confirmed)</span>
              <span className="font-mono text-[var(--color-text-muted)]">34 Leads (70.8%)</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-accent)]" style={{ width: '70.8%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-[var(--color-text)]">Site Visits Scheduled</span>
              <span className="font-mono text-[var(--color-text-muted)]">18 Visits (37.5%)</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-status-warm)]" style={{ width: '37.5%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-[var(--color-text)]">Negotiation & Offer Terms</span>
              <span className="font-mono text-[var(--color-text-muted)]">10 Deals (20.8%)</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-info)]" style={{ width: '20.8%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-[var(--color-text)]">Tokens & Registered Agreements</span>
              <span className="font-mono text-[var(--color-text-muted)]">6 Closed (12.5%)</span>
            </div>
            <div className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-success)]" style={{ width: '12.5%' }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
