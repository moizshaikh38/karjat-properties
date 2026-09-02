import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Activity, Users, MapPin, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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
      setData(response.data.data);
    } catch {
      toast.error('Failed to load analytics');
      setData({
        total_leads: 0,
        qualified_leads: 0,
        site_visits: 0,
        conversions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Analytics</h1>
        <div className="flex space-x-1 bg-[var(--color-surface)] border border-[var(--color-border)] p-1 rounded-lg">
          {['Today', '7D', '30D', '90D'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                range === r ? 'bg-[var(--color-bg)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-[var(--color-surface)] h-32 rounded-xl border border-[var(--color-border)]"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium">Total Leads</h3>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--color-text)]">{data?.total_leads || 0}</p>
            </div>
            
            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium">Qualified Leads</h3>
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--color-text)]">{data?.qualified_leads || 0}</p>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium">Site Visits</h3>
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--color-text)]">{data?.site_visits || 0}</p>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium">Conversions</h3>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--color-text)]">{data?.conversions || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-lg font-medium text-[var(--color-text)] mb-6 flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
                Lead Funnel
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Contacts', value: 100, color: 'bg-blue-500' },
                  { label: 'Responded', value: 85, color: 'bg-indigo-500' },
                  { label: 'Qualified', value: 45, color: 'bg-purple-500' },
                  { label: 'Site Visit Scheduled', value: 25, color: 'bg-amber-500' },
                  { label: 'Closed Won', value: 8, color: 'bg-green-500' }
                ].map((step, i) => (
                  <div key={step.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-text)]">{step.label}</span>
                      <span className="font-medium text-[var(--color-text)]">{step.value}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg)] rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${step.color}`} style={{ width: `${step.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-lg font-medium text-[var(--color-text)] mb-6 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
                Top Properties Interest
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'Riverside Villas Phase 1', count: 142 },
                  { name: 'Mountain View Apartments', count: 98 },
                  { name: 'Karjat Greens Plot Scheme', count: 75 },
                  { name: 'Sunrise Valley Residencia', count: 42 }
                ].map(prop => (
                  <div key={prop.name} className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                    <span className="font-medium text-[var(--color-text)]">{prop.name}</span>
                    <span className="text-sm bg-[var(--color-surface)] px-2 py-1 rounded text-[var(--color-text-muted)] border border-[var(--color-border)]">
                      {prop.count} leads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
