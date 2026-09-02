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
import {
  getCachedMessages,
  setCachedMessages,
  getCachedConversation,
  setCachedConversation,
  updateCachedConversationMode,
  fetchConversationMessages,
} from '../services/conversationCache';

interface ChatWindowProps {
  conversationId: string;
  initialConversation?: Conversation | null;
  onModeChange?: () => void;
}

export default function ChatWindow({ conversationId, initialConversation, onModeChange }: ChatWindowProps) {
  const navigate = useNavigate();

  // Initialize immediately from cache or initialConversation for <50ms instant response
  const cachedConv = (initialConversation || getCachedConversation(conversationId) || DEMO_CONVERSATIONS.find(c => c.id === conversationId) || null) as Conversation | null;
  const cachedMsgs = getCachedMessages(conversationId);

  const [conversation, setConversation] = useState<Conversation | null>(() => cachedConv);
  const [messages, setMessages] = useState<Message[]>(() => cachedMsgs || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedMsgs && !cachedConv);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);

  const prevMsgCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvIdRef = useRef<string>(conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize active conversation ID ref
  activeConvIdRef.current = conversationId;

  // Instant switch effect: updates UI immediately from cache, aborts previous requests
  useEffect(() => {
    const switchStart = performance.now();
    console.log(`[PERF] CHAT_SWITCH_START conversationId=${conversationId}`);

    // 1. Cancel previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Instant local lookup
    const resolvedConv = (initialConversation || getCachedConversation(conversationId) || DEMO_CONVERSATIONS.find(c => c.id === conversationId) || null) as Conversation | null;
    const currentCachedMsgs = getCachedMessages(conversationId);

    if (resolvedConv) {
      setConversation(resolvedConv);
      setCachedConversation(resolvedConv);
    }

    if (currentCachedMsgs && currentCachedMsgs.length > 0) {
      setMessages(currentCachedMsgs);
      setLoading(false);
      console.log(`[PERF] CHAT_SWITCH_STATE_UPDATED (from cache) duration=${(performance.now() - switchStart).toFixed(1)}ms`);
    } else {
      // Clear previous conversation messages to prevent cross-conversation leak
      setMessages([]);
      setLoading(true);
      console.log(`[PERF] CHAT_SWITCH_STATE_UPDATED (uncached, showing skeleton) duration=${(performance.now() - switchStart).toFixed(1)}ms`);
    }

    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;

    // 3. Background fetch for fresh messages (avoids fetching redundant full /conversations list)
    const loadMessages = async () => {
      try {
        console.log(`[PERF] CHAT_FETCH_START conversationId=${conversationId}`);
        const fresh = await fetchConversationMessages(conversationId, controller.signal);
        
        // Guard against race conditions: only update if this is still the active conversation
        if (activeConvIdRef.current === conversationId) {
          setMessages((prev) => {
            if (prev.length === fresh.length) {
              const isIdentical = prev.every((m, idx) => 
                m.id === fresh[idx]?.id && 
                m.status === fresh[idx]?.status && 
                m.text_content === fresh[idx]?.text_content &&
                m.media_url === fresh[idx]?.media_url
              );
              if (isIdentical) return prev;
            }
            return fresh;
          });
          setLoading(false);
          console.log(`[PERF] CHAT_FETCH_END conversationId=${conversationId} duration=${(performance.now() - switchStart).toFixed(1)}ms count=${fresh.length}`);
        }
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          // Request was aborted due to quick conversation switch - cleanly ignore
          return;
        }
        if (activeConvIdRef.current === conversationId) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    // 4. Lightweight background polling (only polls this conversation's messages, NOT full list)
    const interval = setInterval(() => {
      if (activeConvIdRef.current === conversationId) {
        fetchConversationMessages(conversationId)
          .then((fresh) => {
            if (activeConvIdRef.current === conversationId) {
              setMessages((prev) => {
                if (prev.length === fresh.length) {
                  const isIdentical = prev.every((m, idx) => 
                    m.id === fresh[idx]?.id && 
                    m.status === fresh[idx]?.status && 
                    m.text_content === fresh[idx]?.text_content &&
                    m.media_url === fresh[idx]?.media_url
                  );
                  if (isIdentical) return prev;
                }
                return fresh;
              });
            }
          })
          .catch(() => {});
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [conversationId, initialConversation]);

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
    const targetMode: 'ai' | 'human' | 'paused' = 
      action === 'takeover' ? 'human' : action === 'release-to-ai' ? 'ai' : 'paused';
    
    // Optimistic UI update for immediate response
    setConversation((prev) => (prev ? { ...prev, mode: targetMode } : null));
    updateCachedConversationMode(conversationId, targetMode);

    try {
      await api.post(`/conversations/${conversationId}/${action}`);
      toast.success(`Mode updated to ${action.replace('-', ' ')}`);
      if (onModeChange) onModeChange();
    } catch (err) {
      toast.error('Failed to change mode');
      // Revert if failed
      if (initialConversation) setConversation(initialConversation);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      await api.post(`/conversations/${conversationId}/messages`, { type: 'text', text: textToSend });
      // Refresh messages
      const updated = await fetchConversationMessages(conversationId);
      if (activeConvIdRef.current === conversationId) {
        setMessages(updated);
      }
    } catch (err) {
      toast.error('Failed to send message');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  if (!conversation && loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)] gap-2">
        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-[12px]">Loading chat...</span>
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
        {loading && messages.length === 0 ? (
          <div className="p-4 space-y-3.5 animate-pulse">
            <div className="flex justify-start">
              <div className="w-52 h-11 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px]" />
            </div>
            <div className="flex justify-end">
              <div className="w-64 h-14 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px]" />
            </div>
            <div className="flex justify-start">
              <div className="w-72 h-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px]" />
            </div>
          </div>
        ) : messages.length === 0 ? (
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
                  {msg.media_url && (
                    <div className="mb-2 rounded-[4px] overflow-hidden max-w-sm">
                      <img 
                        src={msg.media_url} 
                        alt="Property photograph" 
                        className="w-full h-auto max-h-56 object-cover rounded-[4px] cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(msg.media_url, '_blank')}
                      />
                    </div>
                  )}
                  {msg.text_content && (
                    <div className="break-words whitespace-pre-wrap">
                      {msg.text_content}
                    </div>
                  )}
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
