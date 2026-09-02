import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lead } from '../types';
import toast from 'react-hot-toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus, RefreshCw, MessageSquare, Phone } from 'lucide-react';
import { DEMO_LEADS } from '../data/demoData';

const STAGES = [
  { id: 'NEW', title: 'New Inquiries' },
  { id: 'QUALIFIED', title: 'Qualified Buyers' },
  { id: 'PROPERTY_INTEREST', title: 'Property Discussion' },
  { id: 'SITE_VISIT', title: 'Site Visit Booked' },
  { id: 'NEGOTIATION', title: 'Offer & Terms' },
  { id: 'CONVERTED', title: 'Deal Closed' }
];

export default function Pipeline() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      const raw = res.data?.data;
      const list = raw?.leads || (Array.isArray(raw) ? raw : []);
      setLeads(list.length > 0 ? list : DEMO_LEADS as any);
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
  const getLeadsByStage = (stageId: string) => leadList.filter(l => l.status === stageId || (stageId === 'NEW' && !l.status));

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Buyer Sales Pipeline
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Progress high-intent buyer inquiries through Karjat site visits and property closures.
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
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => navigate('/leads')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* KANBAN BOARD (Touch-Scroll & Snap on Mobile) */}
      <div className="flex-1 overflow-x-auto pb-4 hide-scrollbar touch-scroll snap-x snap-mandatory">
        <div className="flex gap-3.5 h-full min-w-max items-start">
          {STAGES.map(stage => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div 
                key={stage.id} 
                className="w-72 sm:w-76 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] snap-start"
              >
                {/* Column Header */}
                <div className="px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex justify-between items-center rounded-t-[6px]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--color-text)] text-[13px] tracking-tight">{stage.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)] bg-[var(--color-surface)] px-1.5 py-0.2 rounded border border-[var(--color-border)] tabular-nums">
                    {stageLeads.length}
                  </span>
                </div>
                
                {/* Cards Container */}
                <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-210px)] min-h-[140px] hide-scrollbar">
                  {loading ? (
                    <div className="h-20 bg-[var(--color-surface-elevated)] rounded-[6px] animate-pulse"></div>
                  ) : stageLeads.length === 0 ? (
                    <div className="text-center text-[11px] text-[var(--color-text-muted)] py-6">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const isHot = lead.classification === 'HOT' || lead.temperature === 'HOT';
                      const isWarm = lead.classification === 'WARM' || lead.temperature === 'WARM';

                      return (
                        <div 
                          key={lead.id} 
                          onClick={() => navigate(`/inbox`)}
                          className="bg-[var(--color-surface)] p-3 rounded-[6px] border border-[var(--color-border)] hover:border-[var(--color-border)]/80 hover:bg-[var(--color-surface-elevated)]/30 transition-colors cursor-pointer space-y-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.1)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-[var(--color-text)] text-[13px] truncate">
                              {lead.name || 'Karjat Prospect'}
                            </span>
                            <Badge variant={isHot ? 'hot' : isWarm ? 'warm' : 'cold'}>
                              {isHot ? 'Hot' : isWarm ? 'Warm' : 'Cold'}
                            </Badge>
                          </div>

                          <div className="text-[11px] text-[var(--color-text-muted)] flex items-center justify-between font-mono">
                            <span>{lead.phone}</span>
                            <span className="font-sans font-medium text-[var(--color-text)] text-[12px] font-display">
                              {lead.lead_score ? `Score: ${lead.lead_score}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[11px]">
                            <span className="text-[var(--color-text-muted)] truncate max-w-[140px]">
                              Karjat Villa Buyer
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/inbox');
                              }}
                              className="text-[var(--color-accent)] hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
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
