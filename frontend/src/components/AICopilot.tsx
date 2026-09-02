import React, { useState, useEffect } from 'react';
import { User, Target, Brain, Home, Copy, ChevronDown, ChevronRight, Activity, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AICopilot({ conversationId, leadId }: { conversationId: string, leadId?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    requirements: true,
    insights: true,
    properties: false
  });

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setLoading(true);
        // Fetch AI intelligence
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
          // If no leadId, try to get it from conversation
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

  if (loading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-[var(--color-surface-elevated)] rounded"></div>
        <div className="h-24 bg-[var(--color-surface-elevated)] rounded"></div>
      </div>
    );
  }

  const { intelligence, lead, requirements, interactions } = data || {};

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="font-medium">AI Copilot</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Customer Profile */}
        <Section title="Customer Profile" icon={<User className="w-4 h-4" />} isOpen={expandedSections.profile} onToggle={() => toggleSection('profile')}>
          {lead ? (
            <div className="space-y-3">
              <div>
                <div className="font-medium text-sm">{lead.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{lead.phone}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.temperature && (
                  <span className="text-[10px] px-2 py-1 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                    Temp: <span className="font-semibold">{lead.temperature}</span>
                  </span>
                )}
                {lead.lead_score !== undefined && (
                  <span className="text-[10px] px-2 py-1 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                    Score: <span className="font-semibold text-[var(--color-primary)]">{lead.lead_score}</span>
                  </span>
                )}
              </div>
              <Link to={`/leads?id=${lead.id}`} className="text-xs text-[var(--color-primary)] flex items-center gap-1 hover:underline mt-2">
                View Full Profile <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">No lead profile found.</div>
          )}
        </Section>

        {/* Requirements */}
        <Section title="Requirements" icon={<Target className="w-4 h-4" />} isOpen={expandedSections.requirements} onToggle={() => toggleSection('requirements')}>
          {requirements ? (
            <div className="space-y-2 text-sm">
              {requirements.budget && <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Budget:</span> <span>{requirements.budget}</span></div>}
              {requirements.bhk && <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">BHK:</span> <span>{requirements.bhk}</span></div>}
              {requirements.location && <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Location:</span> <span>{requirements.location}</span></div>}
              {requirements.property_type && <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Type:</span> <span>{requirements.property_type}</span></div>}
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">No requirements gathered yet.</div>
          )}
        </Section>

        {/* AI Insights */}
        <Section title="Intelligence" icon={<Activity className="w-4 h-4" />} isOpen={expandedSections.insights} onToggle={() => toggleSection('insights')}>
          {intelligence ? (
            <div className="space-y-4">
              {intelligence.sentiment && (
                <div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">Sentiment</div>
                  <div className="text-sm capitalize">{intelligence.sentiment}</div>
                </div>
              )}
              {intelligence.insights && (
                <div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">Key Insights</div>
                  <ul className="text-sm list-disc pl-4 space-y-1 text-[var(--color-text)]">
                    {Array.isArray(intelligence.insights) ? intelligence.insights.map((insight: string, i: number) => <li key={i}>{insight}</li>) : <li>{intelligence.insights}</li>}
                  </ul>
                </div>
              )}
              {intelligence.suggestedReply && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-2 flex justify-between items-center">
                    Suggested Reply
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(intelligence.suggestedReply);
                        toast.success('Copied to clipboard');
                      }}
                      className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800/50 rounded"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-sm text-[var(--color-text)]">{intelligence.suggestedReply}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">No active insights available.</div>
          )}
        </Section>

        {/* Interested Properties */}
        <Section title="Interested Properties" icon={<Home className="w-4 h-4" />} isOpen={expandedSections.properties} onToggle={() => toggleSection('properties')}>
          {interactions && interactions.length > 0 ? (
            <div className="space-y-2">
              {interactions.filter((i: any) => i.type === 'property_view').slice(0, 3).map((interaction: any, idx: number) => (
                <div key={idx} className="text-sm p-2 bg-[var(--color-surface-elevated)] rounded border border-[var(--color-border)]">
                  <div className="font-medium">{interaction.property_name || 'Property Inquiry'}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{new Date(interaction.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">No specific properties viewed yet.</div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children, isOpen, onToggle }: { title: string, icon: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
  return (
    <div className="mb-2">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors text-sm font-medium text-[var(--color-text)]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">{icon}</span>
          {title}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />}
      </button>
      {isOpen && (
        <div className="p-2 pt-1 pl-8">
          {children}
        </div>
      )}
    </div>
  );
}
