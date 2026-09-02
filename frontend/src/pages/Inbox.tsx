import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bot, User, Clock, MessageSquare, Plus, Sparkles, Radio } from 'lucide-react';
import api from '../services/api';
import { Conversation, Lead } from '../types';
import ChatWindow from '../components/ChatWindow';
import AICopilot from '../components/AICopilot';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../components/ui/Badge';
import { DEMO_CONVERSATIONS } from '../data/demoData';

import { setCachedConversation, prefetchConversations } from '../services/conversationCache';

export default function Inbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<'all' | 'ai' | 'human' | 'paused'>('all');
  const [search, setSearch] = useState('');
  
  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations').catch(() => ({ data: { data: [] } }));
      const raw = res.data?.data;
      const dbList: any[] = Array.isArray(raw) ? raw : raw?.conversations || [];
      
      // Process real database conversations
      const realDbList = dbList.map((c: any) => ({
        ...c,
        isLiveReal: true,
        lead: c.lead || {
          name: c.whatsapp_phone || 'WhatsApp Prospect',
          phone: c.whatsapp_phone,
          classification: 'HOT',
          temperature: 'HOT',
          status: 'discovery'
        }
      }));

      // Merge DEMO_CONVERSATIONS (always keep all 6 demo chats available)
      const realPhoneSet = new Set(realDbList.map((c: any) => c.whatsapp_phone?.replace(/\D/g, '')));
      const realIdSet = new Set(realDbList.map((c: any) => c.id));

      const cleanDemo = DEMO_CONVERSATIONS.filter(d => {
        const dCleanPhone = d.whatsapp_phone?.replace(/\D/g, '');
        return !realPhoneSet.has(dCleanPhone) && !realIdSet.has(d.id);
      }).map(d => ({ ...d, isDemo: true }));

      // Combined list: Live real customer chats + curated demo showcase chats
      const allMerged = [...realDbList, ...cleanDemo];
      setConversations(allMerged as any);

      // Populate local conversation cache and prefetch top 5 active conversations in background
      allMerged.forEach((c) => setCachedConversation(c as any));
      prefetchConversations(allMerged.slice(0, 5).map((c) => c.id));
    } catch (err) {
      setConversations(DEMO_CONVERSATIONS as any);
      DEMO_CONVERSATIONS.forEach((c) => setCachedConversation(c as any));
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations
    .filter(c => filter === 'all' || c.mode === filter)
    .filter(c => 
      c.whatsapp_phone?.includes(search) || 
      c.lead?.name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const listRef = useRef<HTMLDivElement>(null);
  const listScrollPosRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedId = location.pathname.split('/inbox/')[1]?.trim() || '';
  const isConversationSelected = Boolean(selectedId);
  const currentConvId = selectedId || (!isMobile ? (filteredConversations[0]?.id ?? '') : '');
  const activeConv = filteredConversations.find(c => c.id === currentConvId) || conversations.find(c => c.id === currentConvId) || null;

  // Desktop only: auto-redirect /inbox to first conversation for split-pane
  // On mobile: keep /inbox on the conversation list so Back button returns to list!
  useEffect(() => {
    if (isMobile) return;
    if (!selectedId && filteredConversations[0]?.id) {
      navigate(`/inbox/${filteredConversations[0].id}`, { replace: true });
    }
  }, [isMobile, selectedId, filteredConversations]);

  // Restore scroll position when returning from chat to list on mobile
  useEffect(() => {
    if (!isConversationSelected && listRef.current && listScrollPosRef.current > 0) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listScrollPosRef.current;
        }
      });
    }
  }, [isConversationSelected]);

  return (
    <div className="flex h-full w-full bg-[var(--color-bg)] overflow-hidden">
      
      {/* LEFT PANE - High Density WhatsApp Conversation List (320px) */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col ${isMobile && isConversationSelected ? 'hidden' : 'block'}`}>
        
        {/* Search & Filter Header */}
        <div className="p-3 border-b border-[var(--color-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Karjat Properties" 
                className="w-5 h-5 rounded-full object-cover shadow-xs border border-[var(--color-border)] flex-shrink-0" 
              />
              <h2 className="text-[14px] font-semibold text-[var(--color-text)] tracking-tight">WhatsApp Chats</h2>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono tabular-nums">
              {filteredConversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <input 
              type="text"
              placeholder="Search phone or buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] rounded-[6px] pl-8 pr-2.5 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)]">
            {(['all', 'ai', 'human', 'paused'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-1 text-[11px] font-medium rounded-[4px] capitalize transition-colors text-center cursor-pointer ${
                  filter === f 
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)] hide-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-[var(--color-text-muted)]">
              No matching WhatsApp chats found.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const lead: any = conv.lead || {};
              const isSelected = currentConvId === conv.id;
              const isHot = lead.classification === 'HOT' || lead.temperature === 'HOT';
              const isWarm = lead.classification === 'WARM' || lead.temperature === 'WARM';
              const isLive = (conv as any).isLiveReal;
              
              const lastMsgObj = (conv as any).lastMessage || (conv as any).messages?.[(conv as any).messages?.length - 1];
              const lastText = lastMsgObj?.text_content || 'Active WhatsApp conversation';

              return (
                <div 
                  key={conv.id}
                  onClick={() => {
                    console.log(`[PERF] CHAT_SWITCH_CLICK conversationId=${conv.id}`);
                    if (listRef.current) {
                      listScrollPosRef.current = listRef.current.scrollTop;
                    }
                    navigate(`/inbox/${conv.id}`);
                  }}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[var(--color-surface-elevated)] border-l-2 border-l-[var(--color-accent)]' 
                      : 'hover:bg-[var(--color-surface-elevated)]/40 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      {isLive && (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Live Customer" />
                      )}
                      <span className="font-medium text-[13px] text-[var(--color-text)] truncate">
                        {lead.name || conv.whatsapp_phone}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap font-mono tabular-nums">
                      {conv.last_message_at 
                        ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false }) 
                        : 'Just now'}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-[var(--color-text-muted)] line-clamp-1 mb-1.5 italic">
                    "{lastText}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
                    <span className="text-[11px]">{conv.whatsapp_phone}</span>
                    <Badge variant={isHot ? 'hot' : isWarm ? 'warm' : 'cold'} size="sm">
                      {isLive ? 'Live Lead' : (isHot ? 'Hot Lead' : 'Warm Lead')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--color-border)]/40 text-[10.5px] text-[var(--color-text-muted)]">
                    <span className="truncate max-w-[170px] text-[var(--color-accent)] font-medium">
                      {lead.preferred_bhk ? `${lead.preferred_bhk} · ${lead.property_type || 'Villa'}` : (lead.status ? `Stage: ${lead.status}` : 'Karjat Inquirer')}
                    </span>
                    <span className="font-medium">
                      {conv.mode === 'human' ? '👤 Human' : '🤖 AI Active'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER & RIGHT: CHAT THREAD + COPILOT WORKSPACE */}
      <div className={`flex-1 flex overflow-hidden ${isMobile && !isConversationSelected ? 'hidden' : 'flex'}`}>
        {currentConvId ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 h-full overflow-hidden">
              <ChatWindow 
                conversationId={currentConvId} 
                initialConversation={activeConv} 
                onModeChange={fetchConversations} 
              />
            </div>
            <div className="hidden xl:block w-80 flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-full overflow-y-auto hide-scrollbar">
              <AICopilot conversationId={currentConvId} leadId={activeConv?.lead?.id} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] text-[13px] gap-2.5 p-6 text-center">
            <img 
              src="/logo.png" 
              alt="Karjat Properties" 
              className="w-16 h-16 rounded-full object-cover shadow-md border border-[var(--color-border)] opacity-85 mb-1" 
            />
            <span className="font-medium text-[14px] text-[var(--color-text)] font-display">Karjat Properties CRM</span>
            <span className="text-[12px] text-[var(--color-text-muted)] max-w-xs">Select a WhatsApp conversation from the left to inspect customer preferences and start messaging.</span>
          </div>
        )}
      </div>

    </div>
  );
}
