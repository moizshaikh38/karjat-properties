import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, PauseCircle, Send, Check, CheckCheck, AlertCircle, ArrowLeft, Sparkles, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Conversation, Message, Lead } from '../types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import AICopilot from './AICopilot';
import { DEMO_CONVERSATIONS } from '../data/demoData';

interface ChatWindowProps {
  conversationId: string;
  onModeChange?: () => void;
}

export default function ChatWindow({ conversationId, onModeChange }: ChatWindowProps) {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);

  const prevMsgCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [convRes, msgsRes] = await Promise.all([
        api.get(`/conversations`).catch(() => ({ data: { data: [] } })),
        api.get(`/conversations/${conversationId}/messages`).catch(() => ({ data: { data: [] } }))
      ]);
      const convList = convRes.data?.data || [];
      let conv = convList.find((c: any) => c.id === conversationId);
      if (!conv) {
        conv = DEMO_CONVERSATIONS.find(c => c.id === conversationId);
      }
      if (conv) setConversation(conv);

      const rawMsgs = msgsRes.data?.data || [];
      const isDemo = String(conversationId).startsWith('conv-');
      const demoConv = DEMO_CONVERSATIONS.find(c => c.id === conversationId);
      
      const newMsgs = (rawMsgs.length > 0 || !isDemo)
        ? rawMsgs
        : (demoConv?.messages || []);

      setMessages((prev) => {
        if (prev.length === newMsgs.length) {
          const isIdentical = prev.every((m, idx) => m.id === newMsgs[idx]?.id && m.status === newMsgs[idx]?.status && m.text_content === newMsgs[idx]?.text_content);
          if (isIdentical) return prev;
        }
        return newMsgs as any;
      });
    } catch (err) {
      const demoConv = DEMO_CONVERSATIONS.find(c => c.id === conversationId);
      if (demoConv) {
        setConversation(demoConv as any);
        setMessages((demoConv.messages || []) as any);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
      prevMsgCountRef.current = messages.length;
      return;
    }

    if (messages.length > prevMsgCountRef.current) {
      const container = containerRef.current;
      const isNearBottom = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 180
        : true;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      prevMsgCountRef.current = messages.length;
    }
  }, [messages]);

  const handleModeChange = async (action: 'takeover' | 'release-to-ai' | 'pause') => {
    try {
      await api.post(`/conversations/${conversationId}/${action}`);
      toast.success(`Mode updated to ${action.replace('-', ' ')}`);
      fetchData();
      if (onModeChange) onModeChange();
    } catch (err) {
      toast.error('Failed to change mode');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    try {
      setSending(true);
      await api.post(`/conversations/${conversationId}/messages`, { text: inputText.trim() });
      setInputText('');
      fetchData();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading && !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)]">
        <span className="text-[12px]">Loading WhatsApp messages...</span>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)] text-[12px]">
        Conversation not found
      </div>
    );
  }

  const isAiMode = conversation.mode === 'ai';
  const lead: Partial<Lead> = conversation.lead || {};

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] relative">
      
      {/* CHAT HEADER */}
      <div className="h-12 px-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <button 
            onClick={() => navigate('/inbox')} 
            className="md:hidden p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="h-7 w-7 rounded-[4px] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] font-medium text-[12px] flex-shrink-0 font-display">
            {(lead.name?.[0] || conversation.whatsapp_phone?.[0] || 'K').toUpperCase()}
          </div>
          
          <div className="min-w-0 truncate">
            <div className="font-medium text-[13px] text-[var(--color-text)] truncate flex items-center gap-2">
              <span>{lead.name || conversation.whatsapp_phone}</span>
              {lead.temperature && (
                <Badge variant={lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'} size="sm">
                  {lead.temperature}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Copilot Trigger */}
          <button
            onClick={() => setMobileCopilotOpen(true)}
            className="xl:hidden p-1.5 text-[var(--color-accent)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[4px] hover:text-[var(--color-text)] cursor-pointer"
            title="Customer details"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {isAiMode || conversation.mode === 'paused' ? (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handleModeChange('takeover')}
              leftIcon={<User className="w-3 h-3 text-[var(--color-text-muted)]" />}
            >
              Takeover
            </Button>
          ) : (
            <Button 
              variant="primary"
              size="sm"
              onClick={() => handleModeChange('release-to-ai')}
              leftIcon={<Bot className="w-3 h-3" />}
            >
              Release to AI
            </Button>
          )}

          {conversation.mode !== 'paused' && (
            <button 
              onClick={() => handleModeChange('pause')}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-[4px] transition-colors cursor-pointer"
              title="Pause automation"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES STREAM (WHATSAPP CHAT INTERFACE) */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[var(--color-bg)] hide-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="text-center text-[12px] text-[var(--color-text-muted)] py-12">
            No messages recorded in this conversation yet.
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.direction === 'outgoing';
            return (
              <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 text-[13px] leading-relaxed shadow-[0_1px_2px_0_rgba(0,0,0,0.15)] ${
                    isOutgoing 
                      ? 'bg-[var(--color-accent)] text-white rounded-[6px] rounded-tr-[2px]' 
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] rounded-[6px] rounded-tl-[2px] border border-[var(--color-border)]'
                  }`}
                >
                  <div className="break-words whitespace-pre-wrap">
                    {msg.text_content}
                  </div>
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-mono tabular-nums ${
                    isOutgoing ? 'text-teal-100/70' : 'text-[var(--color-text-muted)]'
                  }`}>
                    <span>{msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}</span>
                    {isOutgoing && (
                      <span className="ml-0.5 inline-flex">
                        {msg.status === 'sent' && <Check className="w-3 h-3 text-teal-100/70" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-teal-100/70" />}
                        {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                        {msg.status === 'failed' && <AlertCircle className="w-3 h-3 text-[var(--color-status-hot)]" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI STATUS BANNER */}
      {isAiMode && (
        <div className="bg-[var(--color-surface-elevated)] px-3 py-1.5 text-center text-[11px] text-[var(--color-text-muted)] flex items-center justify-center gap-1.5 border-t border-[var(--color-border)] flex-shrink-0">
          <Bot className="w-3 h-3 text-[var(--color-accent)]" /> 
          <span>AI assistant handling automated discovery. Staff can type & send anytime.</span>
        </div>
      )}

      {/* COMPOSER */}
      <div className="p-2.5 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type WhatsApp reply (Enter to send, Shift+Enter for newline)..."
            rows={1}
            className="flex-1 max-h-24 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] rounded-[6px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
          />
          <Button 
            type="submit" 
            variant="primary" 
            size="md"
            disabled={!inputText.trim() || sending}
            isLoading={sending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </form>
      </div>

      {/* MOBILE COPILOT DRAWER */}
      {mobileCopilotOpen && (
        <div 
          className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex justify-end"
          onClick={() => setMobileCopilotOpen(false)}
        >
          <div 
            className="w-4/5 max-w-sm bg-[var(--color-surface)] h-full flex flex-col border-l border-[var(--color-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="font-medium text-[13px] text-[var(--color-text)]">Lead Intelligence</span>
              <button 
                onClick={() => setMobileCopilotOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <AICopilot conversationId={conversationId} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
