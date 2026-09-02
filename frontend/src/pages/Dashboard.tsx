import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, MessageSquare, Calendar, Building2, 
  Bot, User, ArrowUpRight, CheckCircle2, Clock, Phone, Sparkles, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DEMO_CONVERSATIONS, DEMO_SITE_VISITS, DEMO_PROPERTIES } from '../data/demoData';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [siteVisits, setSiteVisits] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('Today');

  // Master Global AI vs Human Mode
  const [masterMode, setMasterMode] = useState<'ai' | 'human' | 'paused'>(() => {
    return (localStorage.getItem('karjat_master_ai_mode') as 'ai' | 'human' | 'paused') || 'ai';
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, convRes, masterRes, visitsRes] = await Promise.all([
        api.get('/analytics/overview', { params: { range: dateRange } }).catch(() => ({ data: { data: null } })),
        api.get('/conversations').catch(() => ({ data: { data: [] } })),
        api.get('/conversations/master-mode').catch(() => ({ data: { data: { masterMode: 'ai' } } })),
        api.get('/site-visits').catch(() => ({ data: { data: [] } })),
      ]);

      setData(analyticsRes.data?.data || null);
      const rawConv = convRes.data?.data;
      const convList = Array.isArray(rawConv) ? rawConv : rawConv?.conversations || [];
      setConversations(convList.length > 0 ? convList : DEMO_CONVERSATIONS);

      const rawVisits = visitsRes.data?.data;
      const visitsList = Array.isArray(rawVisits) ? rawVisits : [];
      setSiteVisits(visitsList.length > 0 ? visitsList : DEMO_SITE_VISITS);

      if (masterRes.data?.data?.masterMode) {
        setMasterMode(masterRes.data.data.masterMode);
      }
    } catch (err) {
      console.error(err);
      setConversations(DEMO_CONVERSATIONS);
      setSiteVisits(DEMO_SITE_VISITS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleMasterModeChange = async (newMode: 'ai' | 'human' | 'paused') => {
    setMasterMode(newMode);
    localStorage.setItem('karjat_master_ai_mode', newMode);

    try {
      if (newMode === 'human') {
        await api.post('/conversations/master-mode', { mode: 'human', applyToExisting: true });
        setConversations(prev => prev.map(c => ({ ...c, mode: 'human' })));
        toast.success('Master Mode: Human staff handling all active chats');
      } else if (newMode === 'ai') {
        await api.post('/conversations/master-mode', { mode: 'ai', applyToExisting: false });
        toast.success('Master Mode: AI sales assistant active');
      } else {
        await api.post('/conversations/master-mode', { mode: 'paused', applyToExisting: true });
        setConversations(prev => prev.map(c => ({ ...c, mode: 'paused' })));
        toast('Master Mode: Automation paused');
      }
    } catch (err) {
      console.error('Failed to sync master mode to backend', err);
      toast.error('Failed to update system master mode');
    }
  };

  const handleToggleConvMode = async (convId: string, currentMode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = currentMode === 'ai' ? 'takeover' : 'release-to-ai';
    try {
      await api.post(`/conversations/${convId}/${action}`);
      const updatedMode = currentMode === 'ai' ? 'human' : 'ai';
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, mode: updatedMode } : c))
      );
      toast.success(`Switched to ${updatedMode === 'ai' ? 'AI mode' : 'human mode'}`);
    } catch (err: any) {
      toast.error('Failed to change mode');
    }
  };

  const leads = data?.leads || {};
  const ai = data?.ai || {};

  return (
    <div className="p-3.5 sm:p-6 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 animate-entrance">
      
      {/* TOP HEADER WITH DATE RANGE & SYNC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Karjat Properties" 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm border border-[var(--color-border)] flex-shrink-0" 
          />
          <div>
            <h1 className="text-[20px] sm:text-[26px] font-medium font-display tracking-tight text-[var(--color-text)]">
              Karjat Real Estate Command Hub
            </h1>
            <p className="text-[12px] sm:text-[13px] text-[var(--color-text-muted)] mt-0.5">
              Active brokerage pipeline, weekend site visits, and WhatsApp discovery metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex gap-0.5 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)]">
            {['Today', '7D', '30D'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 text-[11.5px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  dateRange === range
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* LUXURY HERO FOCUS BANNER & MASTER CONTROLLER */}
      <div className="luxury-card p-4 sm:p-6 rounded-[6px] border border-[var(--color-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        
        {/* Hero Metric */}
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
            <span className="text-[11px] font-medium text-[var(--color-accent)] uppercase tracking-wider">
              Prime Weekend Demand Active
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-[32px] sm:text-[40px] font-medium font-display tracking-tight text-[var(--color-text)]">
              8 Site Visits
            </span>
            <span className="text-[14px] sm:text-[16px] text-[var(--color-text-muted)] font-display">
              scheduled for Saturday & Sunday
            </span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)] max-w-xl">
            Pipeline Volume: <span className="font-medium text-[var(--color-text)] font-mono">₹18.4 Cr</span> across Kashele, Bhilavle & Khandpe villas and sanctioned NA plots.
          </p>
        </div>

        {/* Master AI vs Human Toggle Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-[var(--color-surface-elevated)]/70 rounded-[6px] border border-[var(--color-border)] z-10">
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block">
              Autonomous AI Gateway
            </span>
            <span className="text-[12.5px] font-medium text-[var(--color-text)]">
              {masterMode === 'ai' ? '🤖 AI Autopilot (92% Resolution)' : masterMode === 'human' ? '👤 Human Broker Takeover' : '⏸ Gateway Paused'}
            </span>
          </div>

          <div className="flex gap-1 p-0.5 bg-[var(--color-surface)] rounded-[4px] border border-[var(--color-border)] w-full sm:w-auto">
            <button
              onClick={() => handleMasterModeChange('ai')}
              className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                masterMode === 'ai' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'
              }`}
            >
              AI Mode
            </button>
            <button
              onClick={() => handleMasterModeChange('human')}
              className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                masterMode === 'human' ? 'bg-[var(--color-status-warm)] text-black' : 'text-[var(--color-text-muted)]'
              }`}
            >
              Human
            </button>
            <button
              onClick={() => handleMasterModeChange('paused')}
              className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                masterMode === 'paused' ? 'bg-[var(--color-status-cold)] text-white' : 'text-[var(--color-text-muted)]'
              }`}
            >
              Pause
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRICS STRIP (4 High Precision Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => navigate('/leads')}
          className="luxury-card p-3.5 sm:p-4 rounded-[6px] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-accent)]/50 transition-colors"
        >
          <span className="text-[11px] text-[var(--color-text-muted)] block">Total Buyer Inquiries</span>
          <span className="text-[22px] sm:text-[26px] font-medium font-display text-[var(--color-text)] tabular-nums">48</span>
          <span className="text-[10.5px] text-[var(--color-accent)] block mt-0.5">34 Qualified High-Intent</span>
        </div>

        <div 
          onClick={() => navigate('/pipeline')}
          className="luxury-card p-3.5 sm:p-4 rounded-[6px] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-accent)]/50 transition-colors"
        >
          <span className="text-[11px] text-[var(--color-text-muted)] block">Active Deals in Pipeline</span>
          <span className="text-[22px] sm:text-[26px] font-medium font-display text-[var(--color-accent)] tabular-nums">18</span>
          <span className="text-[10.5px] text-[var(--color-text-muted)] block mt-0.5">₹18.40 Cr potential deal value</span>
        </div>

        <div 
          onClick={() => navigate('/site-visits')}
          className="luxury-card p-3.5 sm:p-4 rounded-[6px] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-accent)]/50 transition-colors"
        >
          <span className="text-[11px] text-[var(--color-text-muted)] block">Weekend Site Visits</span>
          <span className="text-[22px] sm:text-[26px] font-medium font-display text-[var(--color-status-warm)] tabular-nums">8</span>
          <span className="text-[10.5px] text-[var(--color-text-muted)] block mt-0.5">Kashele & Bhilavle properties</span>
        </div>

        <div 
          onClick={() => navigate('/properties')}
          className="luxury-card p-3.5 sm:p-4 rounded-[6px] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-accent)]/50 transition-colors"
        >
          <span className="text-[11px] text-[var(--color-text-muted)] block">Verified Inventory</span>
          <span className="text-[22px] sm:text-[26px] font-medium font-display text-[var(--color-text)] tabular-nums">14</span>
          <span className="text-[10.5px] text-[var(--color-accent)] block mt-0.5">Acre, Guntha & Villas</span>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE: WHATSAPP LIVE STREAM & TODAY'S AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT COLUMN: LIVE WHATSAPP THREADS (High-Density Mobile Card Stack + Desktop Table) */}
        <div className="lg:col-span-2 luxury-card border border-[var(--color-border)] rounded-[6px] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" />
                <h2 className="font-medium text-[13.5px] text-[var(--color-text)]">Live WhatsApp Buyer Inquiries</h2>
              </div>
              <button 
                onClick={() => navigate('/inbox')}
                className="text-[11.5px] font-medium text-[var(--color-accent)] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Open Inbox <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Conversations List (Responsive on Mobile) */}
            <div className="divide-y divide-[var(--color-border)]">
              {conversations.slice(0, 4).map((c) => {
                const lead = c.lead || {};
                const lastMsg = c.messages?.[c.messages.length - 1];

                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/inbox/${c.id}`)}
                    className="p-3 sm:px-4 sm:py-3 hover:bg-[var(--color-surface-elevated)]/50 transition-colors cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[13px] text-[var(--color-text)] truncate">
                          {lead.name || 'Prospect'}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                          {c.whatsapp_phone}
                        </span>
                        <Badge variant={lead.classification === 'HOT' ? 'hot' : 'warm'} size="sm">
                          {lead.classification || 'WARM'}
                        </Badge>
                      </div>

                      <p className="text-[12px] text-[var(--color-text-muted)] line-clamp-1 italic">
                        "{lastMsg?.text_content || 'Inquiring about Karjat properties'}"
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleToggleConvMode(c.id, c.mode, e)}
                        className={`px-2 py-0.5 rounded-[3px] text-[10.5px] font-medium border cursor-pointer ${
                          c.mode === 'ai'
                            ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30'
                            : 'bg-[var(--color-status-warm)]/15 text-[var(--color-status-warm)] border-[var(--color-status-warm)]/30'
                        }`}
                      >
                        {c.mode === 'ai' ? '🤖 AI Active' : '👤 Human'}
                      </button>

                      <span className="text-[10.5px] text-[var(--color-text-muted)] tabular-nums">
                        {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 bg-[var(--color-surface-elevated)]/40 border-t border-[var(--color-border)] text-center">
            <button 
              onClick={() => navigate('/inbox')}
              className="text-[11.5px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-medium cursor-pointer"
            >
              View all {conversations.length} active client conversations →
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: WEEKEND SITE VISITS SCHEDULE */}
        <div className="luxury-card border border-[var(--color-border)] rounded-[6px] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-status-warm)]" />
                <h2 className="font-medium text-[13.5px] text-[var(--color-text)]">Weekend Site Visits</h2>
              </div>
              <button 
                onClick={() => navigate('/site-visits')}
                className="text-[11.5px] font-medium text-[var(--color-accent)] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                All Visits <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 space-y-2.5">
              {siteVisits.slice(0, 3).map((v) => (
                <div 
                  key={v.id}
                  onClick={() => navigate('/site-visits')}
                  className="p-3 bg-[var(--color-surface-elevated)]/60 hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] space-y-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[13px] text-[var(--color-text)]">{v.lead?.name || 'Client'}</span>
                    <Badge variant={v.status === 'scheduled' ? 'success' : 'warm'} size="sm">
                      {v.status}
                    </Badge>
                  </div>

                  <p className="text-[11.5px] text-[var(--color-accent)] font-medium truncate">
                    {v.property?.name || 'Kashele Riverside Villa'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]/40">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> Saturday 11:00 AM
                    </span>
                    <span className="truncate">{v.lead?.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-[var(--color-surface-elevated)]/40 border-t border-[var(--color-border)] text-center">
            <button 
              onClick={() => navigate('/site-visits')}
              className="text-[11.5px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-medium cursor-pointer"
            >
              Manage site visit schedule →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
