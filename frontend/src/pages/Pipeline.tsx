import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lead } from '../types';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 'NEW', title: 'New Leads', color: 'border-blue-500' },
  { id: 'CONTACTED', title: 'Contacted', color: 'border-purple-500' },
  { id: 'QUALIFIED', title: 'Qualified', color: 'border-indigo-500' },
  { id: 'PROPERTY_INTEREST', title: 'Property Interest', color: 'border-cyan-500' },
  { id: 'SITE_VISIT', title: 'Site Visit', color: 'border-orange-500' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-yellow-500' },
  { id: 'CONVERTED', title: 'Converted', color: 'border-green-500' }
];

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await api.get('/leads');
        const raw = res.data?.data;
        const list = raw?.leads || (Array.isArray(raw) ? raw : []);
        setLeads(list);
      } catch (err) {
        toast.error('Failed to load pipeline');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const leadList = Array.isArray(leads) ? leads : [];
  const getLeadsByStage = (stageId: string) => leadList.filter(l => l.status === stageId);

  return (
    <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto bg-[var(--color-bg)]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Pipeline</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Track leads through the sales journey.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {STAGES.map(stage => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div key={stage.id} className="w-72 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex-shrink-0">
                <div className={`p-3 border-b-2 ${stage.color} bg-[var(--color-surface-elevated)] rounded-t-xl flex justify-between items-center`}>
                  <h3 className="font-medium text-[var(--color-text)] text-sm">{stage.title}</h3>
                  <span className="bg-[var(--color-surface)] text-[var(--color-text-muted)] text-xs font-semibold px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                    {stageLeads.length}
                  </span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[var(--color-bg)]/50">
                  {loading ? (
                    <div className="h-24 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse"></div>
                  ) : stageLeads.length === 0 ? (
                    <div className="text-center text-xs text-[var(--color-text-muted)] py-4">No leads in this stage</div>
                  ) : (
                    stageLeads.map(lead => (
                      <div key={lead.id} className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="font-medium text-[var(--color-text)] text-sm mb-1">{lead.name || 'Unknown Lead'}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mb-3">{lead.phone}</div>
                        <div className="flex justify-between items-center">
                          {lead.temperature && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              lead.temperature === 'HOT' ? 'bg-orange-100 text-orange-700' :
                              lead.temperature === 'WARM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {lead.temperature}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                            Score: {lead.lead_score || 0}
                          </span>
                        </div>
                      </div>
                    ))
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
