import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, PauseCircle, Send, Check, CheckCheck, AlertCircle, ArrowLeft, Brain, Sparkles, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Conversation, Message } from '../types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AICopilot from './AICopilot';

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
        api.get(`/conversations`),
        api.get(`/conversations/${conversationId}/messages`)
      ]);
      const convList = convRes.data?.data || [];
      const conv = convList.find((c: any) => c.id === conversationId);
      if (conv) setConversation(conv);

      const newMsgs = msgsRes.data?.data || [];
      setMessages((prev) => {
        if (prev.length === newMsgs.length) {
          const isIdentical = prev.every((m, idx) => m.id === newMsgs[idx]?.id && m.status === newMsgs[idx]?.status);
          if (isIdentical) return prev;
        }
        return newMsgs;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;
    fetchData();
    const interval = setInterval(fetchData, 5000);
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
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 150
        : true;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      prevMsgCountRef.current = messages.length;
    }
  }, [messages]);

  const handleModeChange = async (action: 'takeover' | 'release-to-ai' | 'pause') => {
    if (!window.confirm(`Are you sure you want to switch conversation mode to ${action.replace('-', ' ')}?`)) return;
    try {
      await api.post(`/conversations/${conversationId}/${action}`);
      toast.success(`Mode updated to ${action}`);
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
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Loading WhatsApp messages...</span>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg)]">
        Conversation not found
      </div>
    );
  }

  const isAiMode = conversation.mode === 'ai';
  const isHumanMode = conversation.mode === 'human';

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] relative">
      {/* CHAT HEADER */}
      <div className="h-16 px-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between shadow-xs flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate('/inbox')} 
            className="md:hidden p-1.5 -ml-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0">
            {(conversation.lead?.name?.[0] || conversation.whatsapp_phone?.[0] || 'K').toUpperCase()}
          </div>
          
          <div className="min-w-0 truncate">
            <div className="font-bold text-sm text-[var(--color-text)] truncate">
              {conversation.lead?.name || conversation.whatsapp_phone}
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-mono truncate">
              {conversation.whatsapp_phone}
            </div>
          </div>
        </div>

        {/* MODE CONTROL & AI COPILOT TOGGLE */}
        <div className="flex items-center gap-2">
          {/* Mobile Copilot Trigger */}
          <button
            onClick={() => setMobileCopilotOpen(true)}
            className="lg:hidden p-2 text-purple-600 bg-purple-50 dark:bg-purple-950/40 rounded-lg hover:bg-purple-100 transition-colors"
            title="Open AI Copilot"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {isAiMode || conversation.mode === 'paused' ? (
            <button 
              onClick={() => handleModeChange('takeover')}
              className="text-xs font-bold px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
            >
              <User className="w-3.5 h-3.5" /> <span>Takeover</span>
            </button>
          ) : (
            <button 
              onClick={() => handleModeChange('release-to-ai')}
              className="text-xs font-bold px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Bot className="w-3.5 h-3.5" /> <span>Release to AI</span>
            </button>
          )}

          {conversation.mode !== 'paused' && (
            <button 
              onClick={() => handleModeChange('pause')}
              className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
              title="Pause AI Automation"
            >
              <PauseCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES STREAM */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg)] hide-scrollbar" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(4, 120, 87, 0.03) 0%, transparent 100%)' 
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-xs text-[var(--color-text-muted)] mt-12">
            No messages recorded in this conversation yet.
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.direction === 'outgoing';
            return (
              <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs relative text-sm ${
                  isOutgoing 
                    ? 'bg-emerald-700 text-white rounded-tr-xs' 
                    : 'bg-[var(--color-surface)] text-[var(--color-text)] rounded-tl-xs border border-[var(--color-border)]'
                }`}>
                  <div className="break-words whitespace-pre-wrap leading-relaxed text-[13.5px]">
                    {msg.text_content}
                  </div>
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-medium ${
                    isOutgoing ? 'text-emerald-200' : 'text-[var(--color-text-muted)]'
                  }`}>
                    {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                    {isOutgoing && (
                      <span className="ml-0.5">
                        {msg.status === 'sent' && <Check className="w-3 h-3 text-emerald-200" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                        {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-amber-300" />}
                        {msg.status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-300" />}
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

      {/* AI BOT ACTIVE STATUS BAR */}
      {isAiMode && (
        <div className="bg-purple-50 dark:bg-purple-950/40 px-4 py-2.5 text-center text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2 border-t border-purple-100 dark:border-purple-900/40 flex-shrink-0">
          <Bot className="w-4 h-4 text-purple-600 animate-bounce" /> 
          <span>AI Sales Bot is actively negotiating & answering buyer queries</span>
        </div>
      )}

      {/* HUMAN COMPOSER */}
      {isHumanMode && (
        <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex-shrink-0">
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
              placeholder="Type a WhatsApp reply... (Shift+Enter for newline)"
              className="flex-1 max-h-32 min-h-[44px] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              rows={1}
            />
            <button 
              type="submit" 
              disabled={sending || !inputText.trim()}
              className="h-11 w-11 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex-shrink-0 transition-opacity shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* MOBILE AI COPILOT BOTTOM-SHEET / DRAWER */}
      {mobileCopilotOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
          onClick={() => setMobileCopilotOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-[var(--color-surface)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-[var(--color-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text)]">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Copilot Context
              </div>
              <button 
                onClick={() => setMobileCopilotOpen(false)} 
                className="p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AICopilot conversationId={conversationId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
