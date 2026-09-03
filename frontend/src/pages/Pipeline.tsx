import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lead } from '../types';
import toast from 'react-hot-toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Plus,
  RefreshCw,
  MessageSquare,
  Phone,
  ArrowRight,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Sparkles,
  MapPin,
  Flame,
  Clock
} from 'lucide-react';
import { DEMO_LEADS } from '../data/demoData';

export interface PipelineStageConfig {
  id: string;
  title: string;
  subtitle: string;
  statusKeys: string[];
  accentColor: string;
  headerBadgeVariant: 'default' | 'info' | 'primary' | 'warm' | 'warning' | 'success';
}

const STAGES: PipelineStageConfig[] = [
  {
    id: 'new',
    title: 'New Inquiries',
    subtitle: 'Fresh WhatsApp & portal leads',
    statusKeys: ['new', 'contacted'],
    accentColor: 'border-t-sky-500',
    headerBadgeVariant: 'info',
  },
  {
    id: 'qualified',
    title: 'Qualified Buyers',
    subtitle: 'Verified budget & criteria',
    statusKeys: ['qualified', 'shortlisted'],
    accentColor: 'border-t-indigo-500',
    headerBadgeVariant: 'primary',
  },
  {
    id: 'property_discussion',
    title: 'Property Discussion',
    subtitle: 'Brochure & 7/12 shared',
    statusKeys: ['property_interest', 'property_discussion'],
    accentColor: 'border-t-amber-500',
    headerBadgeVariant: 'warm',
  },
  {
    id: 'site_visit',
    title: 'Site Visit Booked',
    subtitle: 'Weekend guided walkthroughs',
    statusKeys: ['site_visit', 'site_visit_requested', 'site_visit_scheduled', 'site_visit_completed'],
    accentColor: 'border-t-orange-500',
    headerBadgeVariant: 'warning',
  },
  {
    id: 'negotiation',
    title: 'Offer & Terms',
    subtitle: 'Token & agreement drafting',
    statusKeys: ['negotiation'],
    accentColor: 'border-t-purple-500',
    headerBadgeVariant: 'primary',
  },
  {
    id: 'converted',
    title: 'Deals Closed',
    subtitle: 'Token paid / Sale deed signed',
    statusKeys: ['converted'],
    accentColor: 'border-t-emerald-500',
    headerBadgeVariant: 'success',
  },
];

const formatCurrencyCr = (val?: number) => {
  if (!val || val <= 0) return 'Flexible';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 2)} Cr`;
  }
  return `₹${(val / 100000).toFixed(0)} Lakh`;
};

const formatBudgetRange = (lead: any) => {
  if (lead.budget_min && lead.budget_max) {
    return `${formatCurrencyCr(lead.budget_min)} - ${formatCurrencyCr(lead.budget_max)}`;
  }
  if (lead.budget_max) return `Up to ${formatCurrencyCr(lead.budget_max)}`;
  if (lead.budget_min) return `From ${formatCurrencyCr(lead.budget_min)}`;
  return 'Flexible Budget';
};

const formatRequirement = (lead: any) => {
  const parts: string[] = [];
  if (lead.preferred_bhk) parts.push(`${lead.preferred_bhk}${typeof lead.preferred_bhk === 'number' || !String(lead.preferred_bhk).toLowerCase().includes('bhk') && !String(lead.preferred_bhk).toLowerCase().includes('guntha') && !String(lead.preferred_bhk).toLowerCase().includes('acre') ? ' BHK' : ''}`);
  if (lead.property_type) {
    const typeLabel = lead.property_type === 'plot' ? 'NA Plot' : lead.property_type === 'villa' ? 'Villa' : lead.property_type === 'farmhouse' ? 'Farmhouse' : lead.property_type;
    parts.push(typeLabel);
  }
  if (Array.isArray(lead.preferred_locations) && lead.preferred_locations.length > 0) {
    parts.push(lead.preferred_locations[0].replace(', Karjat', ''));
  }
  return parts.length > 0 ? parts.join(' · ') : 'Karjat Real Estate';
};

export default function Pipeline() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      const raw = res.data?.data;
      const list = raw?.leads || (Array.isArray(raw) ? raw : []);
      setLeads(list.length > 0 ? list : (DEMO_LEADS as any));
    } catch (err) {
      setLeads(DEMO_LEADS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const leadList = Array.isArray(leads) ? leads : [];

  // Match leads to stages with case-insensitivity and synonym grouping
  const getLeadsByStage = (stage: PipelineStageConfig) => {
    return leadList.filter((l) => {
      const s = (l.status || 'new').toLowerCase().trim();
      if (stage.statusKeys.includes(s)) return true;
      if (stage.id === 'new' && (!l.status || s === 'new' || s === 'contacted')) return true;
      return false;
    });
  };

  // Move lead stage handler
  const handleMoveStage = async (leadId: string, targetStageKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setMovingLeadId(leadId);
      
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: targetStageKey } : l))
      );

      const targetStage = STAGES.find((s) => s.statusKeys.includes(targetStageKey)) || STAGES[0];
      toast.success(`Moved to ${targetStage.title}`);

      // Sync with backend API
      try {
        await api.patch(`/leads/${leadId}/status`, { status: targetStageKey });
      } catch (patchErr) {
        // Try fallback stage route
        await api.patch(`/leads/${leadId}/stage`, { stage: targetStageKey });
      }
    } catch (err: any) {
      // Revert if API rejected transition
      toast.error(err.response?.data?.error?.message || 'Could not move stage');
      fetchLeads();
    } finally {
      setMovingLeadId(null);
    }
  };

  // Live Pipeline Metrics
  const pipelineMetrics = useMemo(() => {
    let totalVolume = 0;
    let siteVisitCount = 0;
    let closedCount = 0;
    let closedVolume = 0;

    leadList.forEach((l) => {
      const s = (l.status || 'new').toLowerCase().trim();
      const val = (l as any).budget_max || (l as any).budget_min || 0;
      if (s === 'converted') {
        closedCount += 1;
        closedVolume += val;
      } else {
        totalVolume += val;
      }
      if (['site_visit', 'site_visit_requested', 'site_visit_scheduled', 'site_visit_completed'].includes(s)) {
        siteVisitCount += 1;
      }
    });

    return {
      activeCount: leadList.filter((l) => (l.status || 'new').toLowerCase() !== 'converted').length,
      totalVolume,
      siteVisitCount,
      closedCount,
      closedVolume,
    };
  }, [leadList]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
              Buyer Sales Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[11px] font-medium border border-[var(--color-accent)]/30">
              {leadList.length} Deals Tracked
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Progress high-intent buyer inquiries through Karjat site visits, negotiations, and registry closures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLeads} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => navigate('/leads')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add New Lead
          </Button>
        </div>
      </div>

      {/* PIPELINE METRICS SUMMARY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider block font-medium">
            Active Deals Volume
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] sm:text-[22px] font-medium font-display text-[var(--color-accent)] tabular-nums">
              {formatCurrencyCr(pipelineMetrics.totalVolume)}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              ({pipelineMetrics.activeCount} open)
            </span>
          </div>
        </div>

        <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider block font-medium">
            Weekend Site Visits
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] sm:text-[22px] font-medium font-display text-amber-400 tabular-nums">
              {pipelineMetrics.siteVisitCount} Booked
            </span>
            <span className="text-[11px] text-amber-500/80">Kashele / Bhilavle</span>
          </div>
        </div>

        <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider block font-medium">
            Closed Revenue
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] sm:text-[22px] font-medium font-display text-emerald-400 tabular-nums">
              {formatCurrencyCr(pipelineMetrics.closedVolume)}
            </span>
            <span className="text-[11px] text-emerald-500/80">
              ({pipelineMetrics.closedCount} won)
            </span>
          </div>
        </div>

        <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider block font-medium">
            AI Sales Autopilot
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[20px] sm:text-[22px] font-medium font-display text-[var(--color-text)] tabular-nums">
              92% Auto
            </span>
            <span className="text-[11px] text-[var(--color-accent)]">Active</span>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD (Touch-Scroll & Snap on Mobile) */}
      <div className="flex-1 overflow-x-auto pb-4 hide-scrollbar touch-scroll snap-x snap-mandatory">
        <div className="flex gap-3.5 h-full min-w-max items-start">
          {STAGES.map((stage, stageIdx) => {
            const stageLeads = getLeadsByStage(stage);
            const stageVolume = stageLeads.reduce(
              (acc, curr) => acc + ((curr as any).budget_max || (curr as any).budget_min || 0),
              0
            );

            return (
              <div 
                key={stage.id} 
                className={`w-72 sm:w-76 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] snap-start border-t-2 ${stage.accentColor}`}
              >
                {/* Column Header */}
                <div className="px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex justify-between items-center rounded-t-[6px]">
                  <div className="space-y-0.5">
                    <h3 className="font-medium text-[var(--color-text)] text-[13px] tracking-tight flex items-center gap-1.5">
                      <span>{stage.title}</span>
                    </h3>
                    <span className="text-[10.5px] text-[var(--color-text-muted)] block">
                      {formatCurrencyCr(stageVolume)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-[var(--color-text)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] tabular-nums shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>
                
                {/* Cards Container */}
                <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[160px] hide-scrollbar">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-24 bg-[var(--color-surface-elevated)] rounded-[6px] animate-pulse"></div>
                      <div className="h-24 bg-[var(--color-surface-elevated)] rounded-[6px] animate-pulse"></div>
                    </div>
                  ) : stageLeads.length === 0 ? (
                    <div className="text-center text-[11px] text-[var(--color-text-muted)] py-10 border border-dashed border-[var(--color-border)] rounded-[4px] my-1">
                      No deals in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const isHot = lead.classification === 'HOT' || lead.temperature === 'HOT' || lead.temperature === 'VERY_HOT';
                      const isWarm = lead.classification === 'WARM' || lead.temperature === 'WARM';

                      return (
                        <div 
                          key={lead.id} 
                          onClick={() => navigate(`/inbox`)}
                          className="group bg-[var(--color-surface-elevated)]/40 hover:bg-[var(--color-surface-elevated)] p-3 rounded-[6px] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all cursor-pointer space-y-2.5 shadow-xs"
                        >
                          {/* Lead Name + Temp Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-medium font-display text-[var(--color-text)] text-[13.5px] truncate block">
                                {lead.name || 'Karjat Prospect'}
                              </span>
                              <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                                {lead.phone}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={isHot ? 'hot' : isWarm ? 'warm' : 'cold'}>
                                {isHot ? '🔥 Hot' : isWarm ? '⚡ Warm' : 'Cold'}
                              </Badge>
                              {lead.lead_score ? (
                                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                                  Score {lead.lead_score}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Budget & Valuation */}
                          <div className="p-2 bg-[var(--color-surface)]/80 rounded-[4px] border border-[var(--color-border)]/70 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--color-text-muted)]">Budget:</span>
                              <span className="font-semibold text-[var(--color-text)] font-mono">
                                {formatBudgetRange(lead)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[var(--color-text-muted)] truncate">
                              <MapPin className="w-3 h-3 text-[var(--color-accent)] flex-shrink-0" />
                              <span className="truncate">{formatRequirement(lead)}</span>
                            </div>
                          </div>

                          {/* Last Activity Snippet if present */}
                          {(lead as any).last_activity ? (
                            <div className="text-[10.5px] text-[var(--color-text-muted)] line-clamp-2 italic bg-[var(--color-surface)]/40 p-1.5 rounded border border-[var(--color-border)]/40">
                              {(lead as any).last_activity}
                            </div>
                          ) : null}

                          {/* Action Footer & Stage Advancement */}
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/60 text-[11px]">
                            {/* Quick Chat Shortcut */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/inbox');
                              }}
                              className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 flex items-center gap-1 font-medium cursor-pointer"
                              title="Open WhatsApp Chat"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </button>

                            {/* Move Stage Selector */}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={stage.statusKeys[0]}
                                onChange={(e) => handleMoveStage(lead.id, e.target.value, e as any)}
                                disabled={movingLeadId === lead.id}
                                className="text-[10.5px] font-medium rounded-[4px] px-2 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                                title="Move deal stage"
                              >
                                <option value="new">1. New Inquiry</option>
                                <option value="qualified">2. Qualified</option>
                                <option value="property_interest">3. Discussion</option>
                                <option value="site_visit">4. Site Visit</option>
                                <option value="negotiation">5. Offer / Terms</option>
                                <option value="converted">6. Deal Closed</option>
                              </select>

                              {stageIdx < STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMoveStage(lead.id, STAGES[stageIdx + 1].statusKeys[0], e)}
                                  disabled={movingLeadId === lead.id}
                                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] rounded hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                                  title={`Advance to ${STAGES[stageIdx + 1].title}`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
