import React, { useState, useEffect } from 'react';
import { User, Target, Sparkles, Building2, Copy, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface AICopilotProps {
  conversationId: string;
  leadId?: string;
}

export default function AICopilot({ conversationId, leadId }: AICopilotProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    requirements: true,
    insights: true,
    properties: true
  });

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setLoading(true);
        const intelRes = await api.get(`/conversations/${conversationId}/intelligence`).catch(() => ({ data: { data: null } }));
        
        let leadData = null;
        let reqData = null;
        let interactions = null;

        if (leadId) {
          const [l, r, i] = await Promise.all([
            api.get(`/leads/${leadId}`).catch(() => ({ data: { data: null } })),
            api.get(`/leads/${leadId}/requirements`).catch(() => ({ data: { data: null } })),
            api.get(`/leads/${leadId}/interactions`).catch(() => ({ data: { data: null } }))
          ]);
          leadData = l.data?.data;
          reqData = r.data?.data;
          interactions = i.data?.data;
        } else {
          const conv = await api.get(`/conversations`).then(res => res.data?.data?.find((c:any) => c.id === conversationId)).catch(() => null);
          if (conv?.lead?.id) {
            const lId = conv.lead.id;
            const [l, r, i] = await Promise.all([
              api.get(`/leads/${lId}`).catch(() => ({ data: { data: null } })),
              api.get(`/leads/${lId}/requirements`).catch(() => ({ data: { data: null } })),
              api.get(`/leads/${lId}/interactions`).catch(() => ({ data: { data: null } }))
            ]);
            leadData = l.data?.data || conv.lead;
            reqData = r.data?.data;
            interactions = i.data?.data;
          }
        }

        setData({
          intelligence: intelRes.data?.data,
          lead: leadData,
          requirements: reqData,
          interactions: interactions
        });
      } catch (err) {
        console.error("Failed to load context panel data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [conversationId, leadId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/2"></div>
        <div className="h-20 bg-[var(--color-surface-elevated)] rounded"></div>
        <div className="h-20 bg-[var(--color-surface-elevated)] rounded"></div>
      </div>
    );
  }

  const { intelligence, lead, requirements, interactions } = data || {};
  const isHot = lead?.classification === 'HOT' || lead?.temperature === 'HOT';
  const isWarm = lead?.classification === 'WARM' || lead?.temperature === 'WARM';

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)] text-[var(--color-text)] select-none">
      
      {/* HEADER */}
      <div className="h-12 px-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <h3 className="font-medium text-[13px] text-[var(--color-text)]">Lead Intelligence</h3>
        </div>
        {lead?.lead_score && (
          <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
            Score: {lead.lead_score}/100
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 hide-scrollbar text-[12px]">
        
        {/* 1. CUSTOMER PROFILE */}
        <div className="border border-[var(--color-border)] rounded-[6px] p-3 bg-[var(--color-surface)] space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[13px] text-[var(--color-text)]">{lead?.name || 'Karjat Prospect'}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{lead?.phone || 'No phone recorded'}</p>
            </div>
            <Badge variant={isHot ? 'hot' : isWarm ? 'warm' : 'cold'}>
              {isHot ? 'Hot Lead' : isWarm ? 'Warm Lead' : 'Cold'}
            </Badge>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[var(--color-text-muted)] block">Stage</span>
              <span className="font-medium text-[var(--color-text)]">{lead?.status || 'Discovery'}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Assigned</span>
              <span className="font-medium text-[var(--color-text)]">{lead?.assigned_to || 'Karjat Team'}</span>
            </div>
          </div>
        </div>

        {/* 2. VERIFIED BUYER REQUIREMENTS */}
        <div className="border border-[var(--color-border)] rounded-[6px] p-3 bg-[var(--color-surface)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[12px] text-[var(--color-text)]">Buyer Criteria</span>
            <Target className="w-3 h-3 text-[var(--color-text-muted)]" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px]">
            <div>
              <span className="text-[var(--color-text-muted)] block">Budget</span>
              <span className="font-medium font-display text-[var(--color-text)] tabular-nums">
                {requirements?.budget_max ? `Up to ₹${(requirements.budget_max / 100000).toFixed(0)} Lakhs` : 'Flexible'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Configuration</span>
              <span className="font-medium text-[var(--color-text)]">
                {requirements?.bhk ? `${requirements.bhk} BHK Villa` : 'Any BHK'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Preferred Area</span>
              <span className="font-medium text-[var(--color-text)]">
                {requirements?.location || 'Karjat & Surroundings'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Intent Purpose</span>
              <span className="font-medium text-[var(--color-text)]">
                {requirements?.purpose || 'Second Home / Villa'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. AI SUGGESTED RESPONSE */}
        {intelligence?.suggestedReply && (
          <div className="border border-[var(--color-border)] rounded-[6px] p-3 bg-[var(--color-surface-elevated)]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[12px] text-[var(--color-text)]">Suggested Next Reply</span>
              <button 
                onClick={() => copyToClipboard(intelligence.suggestedReply)}
                className="text-[var(--color-accent)] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-[11.5px] text-[var(--color-text)] leading-relaxed italic bg-[var(--color-surface)] p-2 rounded-[4px] border border-[var(--color-border)]">
              "{intelligence.suggestedReply}"
            </p>
          </div>
        )}

        {/* 4. MATCHED KARJAT INVENTORY */}
        <div className="border border-[var(--color-border)] rounded-[6px] p-3 bg-[var(--color-surface)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[12px] text-[var(--color-text)]">Recommended Inventory</span>
            <Building2 className="w-3 h-3 text-[var(--color-text-muted)]" />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="p-2 rounded-[4px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border)]">
              <div className="flex justify-between items-start">
                <span className="font-medium font-display text-[12px] text-[var(--color-text)]">Riverview 3BHK Villa</span>
                <span className="font-medium font-display text-[11px] text-[var(--color-text)] tabular-nums">₹1.25 Cr</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Kashele, Karjat · Ready Possession</p>
            </div>

            <div className="p-2 rounded-[4px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border)]">
              <div className="flex justify-between items-start">
                <span className="font-medium font-display text-[12px] text-[var(--color-text)]">Green Foothills Plot</span>
                <span className="font-medium font-display text-[11px] text-[var(--color-text)] tabular-nums">₹45 L</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Neral-Karjat Road · 5,000 sqft</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
