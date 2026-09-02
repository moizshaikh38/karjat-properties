import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, MessageSquare, Calendar, Building2, 
  Bot, User, ArrowUpRight, CheckCircle2, Clock, Phone
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

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
        api.get('/analytics/overview', { params: { range: dateRange } }),
        api.get('/conversations').catch(() => ({ data: { data: [] } })),
        api.get('/conversations/master-mode').catch(() => ({ data: { data: { masterMode: 'ai' } } })),
        api.get('/site-visits').catch(() => ({ data: { data: [] } })),
      ]);

      setData(analyticsRes.data?.data || null);
      const rawConv = convRes.data?.data;
      setConversations(Array.isArray(rawConv) ? rawConv : rawConv?.conversations || []);
      const rawVisits = visitsRes.data?.data;
      setSiteVisits(Array.isArray(rawVisits) ? rawVisits : []);

      if (masterRes.data?.data?.masterMode) {
        setMasterMode(masterRes.data.data.masterMode);
      }
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

  // Compute Hero Metric Focus
  const hotLeadsCount = leads?.hotLeads || 0;
  const siteVisitsCount = siteVisits.length || leads?.funnel?.visits || 0;
  const totalLeadsCount = leads?.total || 0;

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6 animate-entrance">
      
      {/* PAGE HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Karjat Real Estate Operations
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Active brokerage inventory, WhatsApp lead qualification, and weekend site visits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Master Mode Switcher */}
          <div className="flex items-center p-0.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px]">
            <button
              onClick={() => handleMasterModeChange('ai')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                masterMode === 'ai'
                  ? 'bg-[var(--color-accent)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Active</span>
            </button>
            <button
              onClick={() => handleMasterModeChange('human')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                masterMode === 'human'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Human Only</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* 1. SINGLE HERO METRIC CARD (Linear / Attio Restraint) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-5 sm:p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium text-[var(--color-text-muted)] tracking-tight">
              Today's Key Focus
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[32px] sm:text-[36px] font-medium font-display tracking-tight text-[var(--color-text)] tabular-nums leading-none">
                {siteVisitsCount} Site Visits Scheduled
              </span>
            </div>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {hotLeadsCount} high-intent buyers currently qualifying · {conversations.length} active WhatsApp threads in pipeline
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="md"
              onClick={() => navigate('/site-visits')}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />}
            >
              Open Schedule
            </Button>
            <Button 
              variant="primary"
              size="md"
              onClick={() => navigate('/inbox')}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Open WhatsApp Console
            </Button>
          </div>
        </div>

        {/* Secondary metric strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 mt-5 border-t border-[var(--color-border)] text-[13px]">
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">Total Inquiries</span>
            <span className="text-[16px] font-medium text-[var(--color-text)] tabular-nums">{totalLeadsCount} Leads</span>
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">Hot Qualified Buyers</span>
            <span className="text-[16px] font-medium text-[var(--color-status-hot)] tabular-nums">{hotLeadsCount} Buyers</span>
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">AI Autonomous Resolution</span>
            <span className="text-[16px] font-medium text-[var(--color-accent)] tabular-nums">{ai?.conversations?.aiResolutionRate || 92}%</span>
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">Active Pipeline Val.</span>
            <span className="text-[16px] font-medium font-display text-[var(--color-text)] tabular-nums">₹24.8 Cr</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN DENSE TABLES (SPREADSHEET-FAST VIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE WHATSAPP CONVERSATION THREADS (8 Cols) */}
        <div className="lg:col-span-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-[14px] font-medium text-[var(--color-text)]">Active WhatsApp Pipeline</h2>
              <span className="text-[11px] text-[var(--color-text-muted)]">({conversations.length})</span>
            </div>
            <button
              onClick={() => navigate('/inbox')}
              className="text-[12px] text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View full inbox</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <th className="py-2.5 px-4">Client / Phone</th>
                  <th className="py-2.5 px-4">Interest / Budget</th>
                  <th className="py-2.5 px-4">Lead Status</th>
                  <th className="py-2.5 px-4">Handler</th>
                  <th className="py-2.5 px-4">Updated</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">
                      No active WhatsApp inquiries right now.
                    </td>
                  </tr>
                ) : (
                  conversations.slice(0, 8).map((conv) => {
                    const lead = conv.lead || {};
                    const isHot = lead.classification === 'HOT' || lead.lead_score >= 80;
                    const isWarm = lead.classification === 'WARM' || (lead.lead_score >= 50 && lead.lead_score < 80);
                    
                    return (
                      <tr 
                        key={conv.id} 
                        onClick={() => navigate(`/inbox/${conv.id}`)}
                        className="hover:bg-[var(--color-surface-elevated)]/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-[var(--color-text)]">
                            {lead.name || 'Karjat Buyer'}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
                            {conv.whatsapp_phone}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-[var(--color-text)] truncate max-w-[160px]">
                            {lead.preferred_bhk ? `${lead.preferred_bhk} Villa` : 'Karjat Property'}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] font-display">
                            {lead.budget_max ? `Up to ₹${(lead.budget_max / 100000).toFixed(0)} L` : 'Budget flexible'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={isHot ? 'hot' : isWarm ? 'warm' : 'cold'}>
                            {lead.classification || (isHot ? 'Hot' : isWarm ? 'Warm' : 'Discovery')}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => handleToggleConvMode(conv.id, conv.mode || 'ai', e)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer"
                          >
                            {conv.mode === 'human' ? '👤 Human' : '🤖 AI Bot'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-[11px] text-[var(--color-text-muted)] tabular-nums">
                          {conv.last_message_at 
                            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) 
                            : 'Just now'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inbox/${conv.id}`);
                            }}
                            className="text-[12px] font-medium text-[var(--color-accent)] hover:underline"
                          >
                            Reply
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

        {/* RIGHT COLUMN: SITE VISITS AGENDA & TOP PROPERTIES (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Site Visits Schedule */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                <h2 className="text-[14px] font-medium text-[var(--color-text)]">Site Visit Agenda</h2>
              </div>
              <button
                onClick={() => navigate('/site-visits')}
                className="text-[11px] text-[var(--color-accent)] hover:underline"
              >
                Schedule
              </button>
            </div>

            <div className="divide-y divide-[var(--color-border)] mt-1">
              {siteVisits.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--color-text-muted)]">
                  No upcoming site visits scheduled for today.
                </div>
              ) : (
                siteVisits.slice(0, 4).map((visit) => (
                  <div key={visit.id} className="py-2.5 flex items-start justify-between gap-3 text-[12px]">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[var(--color-text)]">
                        {visit.lead?.name || 'Customer Visit'}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {visit.property?.name || 'Karjat Villa Project'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[var(--color-text)] block tabular-nums">
                        {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}
                      </span>
                      <Badge variant={visit.status === 'completed' ? 'success' : 'warm'} size="sm">
                        {visit.status || 'Scheduled'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Karjat Inventory Overview */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                <h2 className="text-[14px] font-medium text-[var(--color-text)]">Featured Inventory</h2>
              </div>
              <button
                onClick={() => navigate('/properties')}
                className="text-[11px] text-[var(--color-accent)] hover:underline"
              >
                Catalog
              </button>
            </div>

            <div className="divide-y divide-[var(--color-border)] mt-1 text-[12px]">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium font-display text-[var(--color-text)]">Riverview Luxury Villa 3BHK</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Kashele, Karjat · 2,400 sqft</p>
                </div>
                <span className="font-medium font-display text-[var(--color-text)] tabular-nums">₹1.25 Cr</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium font-display text-[var(--color-text)]">Green Foothills Plot #14</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Neral-Karjat Road · 5,000 sqft</p>
                </div>
                <span className="font-medium font-display text-[var(--color-text)] tabular-nums">₹45 L</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium font-display text-[var(--color-text)]">Vakratunda Farmhouse Estate</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Bhivpuri, Karjat · 1.5 Acres</p>
                </div>
                <span className="font-medium font-display text-[var(--color-text)] tabular-nums">₹2.80 Cr</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
