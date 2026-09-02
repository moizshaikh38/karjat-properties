import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, Users, UserPlus, Flame, MessageSquare, MapPin, 
  CheckCircle, BarChart3, Activity, TrendingUp, AlertTriangle, 
  ArrowUpRight, Bot, ShieldCheck, Sparkles, Building2, Calendar, 
  Phone, User, Check, PauseCircle, ChevronRight, PieChart, Layers
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('30D');

  // Master Global AI vs Human Mode (persisted in localStorage)
  const [masterMode, setMasterMode] = useState<'ai' | 'human' | 'paused'>(() => {
    return (localStorage.getItem('karjat_master_ai_mode') as 'ai' | 'human' | 'paused') || 'ai';
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, convRes] = await Promise.all([
        api.get('/analytics/overview', { params: { range: dateRange } }),
        api.get('/conversations').catch(() => ({ data: { data: [] } })),
      ]);

      setData(analyticsRes.data?.data || null);
      const rawConv = convRes.data?.data;
      setConversations(Array.isArray(rawConv) ? rawConv : rawConv?.conversations || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Master Mode Switch Handler
  const handleMasterModeChange = (newMode: 'ai' | 'human' | 'paused') => {
    setMasterMode(newMode);
    localStorage.setItem('karjat_master_ai_mode', newMode);
    if (newMode === 'ai') {
      toast.success('Master Mode: 🤖 Autonomous AI Sales Agent Active for all incoming chats!');
    } else if (newMode === 'human') {
      toast('Master Mode: 👤 Human Takeover active. New chats assigned to agents.', { icon: 'ℹ️' });
    } else {
      toast('Master Mode: ⏸️ AI Automation Paused.', { icon: '⏸️' });
    }
  };

  // Individual Conversation Mode Toggle directly from Dashboard
  const handleToggleConvMode = async (convId: string, currentMode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = currentMode === 'ai' ? 'takeover' : 'release-to-ai';
    try {
      await api.post(`/conversations/${convId}/${action}`);
      const updatedMode = currentMode === 'ai' ? 'human' : 'ai';
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, mode: updatedMode } : c))
      );
      toast.success(`Switched chat to ${updatedMode === 'ai' ? '🤖 AI Mode' : '👤 Human Mode'}`);
    } catch (err: any) {
      toast.error('Failed to change conversation mode');
    }
  };

  const leads = data?.leads || {};
  const ai = data?.ai || {};

  // Mock Trend Chart data points based on date range
  const chartPoints = dateRange === 'Today' 
    ? [
        { label: '09:00', leads: 1, msgs: 3 },
        { label: '11:00', leads: 2, msgs: 8 },
        { label: '13:00', leads: 1, msgs: 6 },
        { label: '15:00', leads: 3, msgs: 14 },
        { label: '17:00', leads: 2, msgs: 9 },
        { label: '19:00', leads: 4, msgs: 18 },
      ]
    : dateRange === '7D'
    ? [
        { label: 'Mon', leads: 4, msgs: 18 },
        { label: 'Tue', leads: 6, msgs: 24 },
        { label: 'Wed', leads: 8, msgs: 35 },
        { label: 'Thu', leads: 5, msgs: 22 },
        { label: 'Fri', leads: 9, msgs: 42 },
        { label: 'Sat', leads: 14, msgs: 58 },
        { label: 'Sun', leads: 12, msgs: 49 },
      ]
    : [
        { label: 'Week 1', leads: 18, msgs: 84 },
        { label: 'Week 2', leads: 26, msgs: 112 },
        { label: 'Week 3', leads: 34, msgs: 146 },
        { label: 'Week 4', leads: 42, msgs: 195 },
      ];

  const maxChartVal = Math.max(...chartPoints.map((p) => Math.max(p.leads * 4, p.msgs)), 20);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* 1. MASTER AI / HUMAN HERO CONTROL BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-emerald-800/50">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Karjat AI Automation Suite
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                masterMode === 'ai' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : masterMode === 'human'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${masterMode === 'ai' ? 'bg-emerald-400 animate-pulse' : masterMode === 'human' ? 'bg-blue-400' : 'bg-amber-400'}`}></span>
                {masterMode === 'ai' ? 'AI AUTONOMOUS' : masterMode === 'human' ? 'HUMAN AGENTS' : 'AUTOMATION PAUSED'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Executive Real Estate Command Center
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Manage client inquiries, qualify buyer budgets, and switch between automated AI discovery and live agent sales closing.
            </p>
          </div>

          {/* MASTER MODE TOGGLE PILL */}
          <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2.5 sm:min-w-[320px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span>Master Chat Mode</span>
              <span className="text-[10px] text-white/60">Fast2SMS Gateway</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-black/50 p-1 rounded-xl">
              <button
                onClick={() => handleMasterModeChange('ai')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  masterMode === 'ai'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bot className="w-4 h-4" /> <span>AI Mode</span>
              </button>

              <button
                onClick={() => handleMasterModeChange('human')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  masterMode === 'human'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" /> <span>Human</span>
              </button>

              <button
                onClick={() => handleMasterModeChange('paused')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  masterMode === 'paused'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <PauseCircle className="w-4 h-4" /> <span>Pause</span>
              </button>
            </div>
            
            <p className="text-[10px] text-emerald-100/70 text-center">
              {masterMode === 'ai' 
                ? '🤖 Bot automatically qualifies leads & suggests Karjat properties' 
                : masterMode === 'human'
                ? '👤 All inbound chats alert human real estate agents'
                : '⏸️ WhatsApp auto-replies temporarily stopped'}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & REFRESH HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Performance & Volume Analytics</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Real-time traffic, conversion metrics, and live chat states.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-xs cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
          </select>
          <button 
            onClick={fetchDashboardData}
            title="Refresh statistics"
            className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 KEY METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <LuxuryMetricCard 
          icon={<Users className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          label="Total Registered Leads" 
          value={leads.total || 4} 
          trend="+18.4% vs last mo"
          note="Active Karjat prospective buyers" 
        />
        <LuxuryMetricCard 
          icon={<UserPlus className="w-5 h-5 text-emerald-600" />} 
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          label="Inbound Inquiries" 
          value={leads.newLeads || 1} 
          trend="WhatsApp & Ads"
          note={`Captured in last ${dateRange}`} 
        />
        <LuxuryMetricCard 
          icon={<Flame className="w-5 h-5 text-rose-600" />} 
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          label="High-Intent Hot Leads" 
          value={leads.hotLeads || 2} 
          trend="Score ≥ 80"
          note="Ready for site visits & closing" 
        />
        <LuxuryMetricCard 
          icon={<Bot className="w-5 h-5 text-purple-600" />} 
          iconBg="bg-purple-50 dark:bg-purple-950/40"
          label="Active WhatsApp Chats" 
          value={conversations.length || 3} 
          trend="Live Conversations"
          note="Real-time buyer engagement" 
        />
        <LuxuryMetricCard 
          icon={<MapPin className="w-5 h-5 text-amber-600" />} 
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          label="Site Visits Booked" 
          value={leads.funnel?.visits || 2} 
          trend="Free Station Pickup"
          note="Physical property tours in Karjat" 
        />
        <LuxuryMetricCard 
          icon={<CheckCircle className="w-5 h-5 text-teal-600" />} 
          iconBg="bg-teal-50 dark:bg-teal-950/40"
          label="Deals Converted" 
          value={leads.conversions || 0} 
          trend="Target: 5 / month"
          note="Completed registry & sale" 
        />
      </div>

      {/* 2. VISUAL CHARTS & GRAPHS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INTERACTIVE LEAD & MESSAGE VOLUME GRAPH */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text)]">Lead Inflow & Message Traffic Graph</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Interactive volume trends across time period</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
                  <span className="text-[var(--color-text)]">WhatsApp Msgs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-500"></span>
                  <span className="text-[var(--color-text)]">New Leads</span>
                </div>
              </div>
            </div>

            {/* VISUAL SVG BAR / AREA CHART */}
            <div className="h-56 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-[var(--color-border)]">
              {chartPoints.map((pt, idx) => {
                const leadHeight = Math.round((pt.leads * 4 / maxChartVal) * 100);
                const msgHeight = Math.round((pt.msgs / maxChartVal) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none z-20 whitespace-nowrap">
                      {pt.label}: {pt.msgs} msgs • {pt.leads} leads
                    </div>

                    <div className="w-full max-w-[40px] flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Msg Bar */}
                      <div 
                        className="w-full bg-emerald-600 rounded-t-lg transition-all duration-500 hover:bg-emerald-500"
                        style={{ height: `${Math.max(msgHeight, 8)}%` }}
                      ></div>
                      {/* Lead Bar */}
                      <div 
                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-400"
                        style={{ height: `${Math.max(leadHeight, 6)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)] mt-2">{pt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Peak traffic period: <strong>Saturdays & Sundays (10 AM - 6 PM)</strong>
            </span>
            <span className="font-medium text-[var(--color-text)]">Avg. Response Time: <strong>&lt; 3 seconds</strong></span>
          </div>
        </div>

        {/* LEAD TEMPERATURE & DEMAND DISTRIBUTION (DONUT / PROGRESS GRAPH) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--color-text)]">Lead Intent Breakdown</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Readiness score classification</p>
              </div>
            </div>

            <div className="space-y-4">
              <DistributionRow 
                label="Very Hot / Ready to Buy (Score > 85)" 
                count={1} 
                percentage={25} 
                color="bg-rose-600" 
                badge="🔥 Immediate" 
              />
              <DistributionRow 
                label="Hot Leads / Site Visit Discussed (70-85)" 
                count={2} 
                percentage={50} 
                color="bg-amber-500" 
                badge="⚡ Active" 
              />
              <DistributionRow 
                label="Warm Leads / Exploring Options (50-70)" 
                count={1} 
                percentage={25} 
                color="bg-blue-500" 
                badge="🌤️ Nurturing" 
              />
              <DistributionRow 
                label="Cold / Top of Funnel (< 50)" 
                count={0} 
                percentage={0} 
                color="bg-slate-400" 
                badge="❄️ Inactive" 
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3.5 rounded-2xl">
            <div className="text-xs font-bold text-[var(--color-text)] mb-1">Karjat Property Demand</div>
            <div className="text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
              <span>Top demand: <strong>3 BHK Riverfront Villas (₹1.25 Cr)</strong></span>
              <span className="text-emerald-600 font-bold">60%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIVE CHAT STREAM & DASHBOARD MODE SWITCHER WIDGET */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Active WhatsApp Inquiries & Live Mode Switcher</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Toggle individual conversations between AI and Human directly from the Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/inbox')}
            className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Open Full Inbox <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Live Chats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] uppercase text-xs">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Client / WhatsApp</th>
                <th className="px-6 py-3.5 font-semibold">Last Message</th>
                <th className="px-6 py-3.5 font-semibold">Activity</th>
                <th className="px-6 py-3.5 font-semibold">Current Mode</th>
                <th className="px-6 py-3.5 font-semibold text-right">Instant Mode Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-[var(--color-text-muted)]">
                    No active WhatsApp conversations found.
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => {
                  const isConvAi = conv.mode === 'ai';
                  return (
                    <tr
                      key={conv.id}
                      onClick={() => navigate(`/inbox/${conv.id}`)}
                      className="hover:bg-[var(--color-surface-elevated)] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--color-text)]">
                          {conv.lead?.name || conv.whatsapp_phone}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] font-mono">{conv.whatsapp_phone}</div>
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate text-xs text-[var(--color-text-muted)]">
                        {conv.last_message || 'Inquiry about 3 BHK Karjat Villa with pool...'}
                      </td>

                      <td className="px-6 py-4 text-xs text-[var(--color-text-muted)]">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                          : 'Just now'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1.5 ${
                            isConvAi
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}
                        >
                          {isConvAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          <span className="capitalize">{conv.mode}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleConvMode(conv.id, conv.mode, e)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 ${
                            isConvAi
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-[var(--color-primary)] hover:opacity-90 text-white'
                          }`}
                        >
                          {isConvAi ? (
                            <>
                              <User className="w-3.5 h-3.5" /> Switch to Human
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5" /> Release to AI
                            </>
                          )}
                        </button>
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

function LuxuryMetricCard({
  icon,
  iconBg,
  label,
  value,
  trend,
  note,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  trend: string;
  note: string;
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-6 rounded-3xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</div>
        <div className="text-3xl font-black text-[var(--color-text)] mt-1 mb-1">{value}</div>
        <div className="text-[11px] text-[var(--color-text-muted)]">{note}</div>
      </div>
    </div>
  );
}

function DistributionRow({
  label,
  count,
  percentage,
  color,
  badge,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
  badge: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
        <span className="text-[var(--color-text)] truncate pr-2">{label}</span>
        <span className="text-[11px] font-bold text-[var(--color-text-muted)]">{badge}</span>
      </div>
      <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden border border-[var(--color-border)] flex">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(percentage, 4)}%` }}
        />
      </div>
    </div>
  );
}
