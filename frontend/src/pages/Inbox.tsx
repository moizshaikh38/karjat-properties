import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, Bot, User, PauseCircle, Filter, Clock } from 'lucide-react';
import api from '../services/api';
import { Conversation } from '../types';
import ChatWindow from '../components/ChatWindow';
import AICopilot from '../components/AICopilot';
import { formatDistanceToNow } from 'date-fns';

export default function Inbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<'all' | 'ai' | 'human' | 'paused'>('all');
  const [search, setSearch] = useState('');
  
  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations
    .filter(c => filter === 'all' || c.mode === filter)
    .filter(c => 
      c.whatsapp_phone.includes(search) || 
      c.lead?.name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  const isMobile = window.innerWidth < 768;
  const isConversationSelected = location.pathname.includes('/inbox/');
  const currentConvId = location.pathname.split('/inbox/')[1];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[var(--color-bg)] overflow-hidden">
      
      {/* LEFT PANE - Conversation List */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col ${isMobile && isConversationSelected ? 'hidden' : 'block'}`}>
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Inbox</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-text-muted)]" />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface-elevated)] border-none text-[var(--color-text)] rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {['all', 'ai', 'human', 'paused'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap capitalize transition-colors ${
                  filter === f 
                    ? 'bg-[var(--color-primary)] text-white' 
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => navigate(`/inbox/${conv.id}`)}
                className={`p-4 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-elevated)] transition-colors ${
                  currentConvId === conv.id ? 'bg-[var(--color-surface-elevated)] border-l-4 border-l-[var(--color-primary)]' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-[var(--color-text)] truncate pr-2">
                    {conv.lead?.name || conv.whatsapp_phone}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1 whitespace-nowrap">
                    {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'New'}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
                    conv.mode === 'ai' ? 'bg-purple-100 text-purple-700' :
                    conv.mode === 'human' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {conv.mode === 'ai' ? <Bot className="w-3 h-3" /> : conv.mode === 'human' ? <User className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                    <span className="capitalize">{conv.mode}</span>
                  </span>
                  {conv.lead?.temperature && (
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      conv.lead.temperature === 'HOT' ? 'bg-orange-100 text-orange-700' :
                      conv.lead.temperature === 'WARM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {conv.lead.temperature}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER PANE & RIGHT PANE Routes */}
      <div className={`flex-1 flex ${isMobile && !isConversationSelected ? 'hidden' : 'block'}`}>
        <Routes>
          <Route path="/" element={
            <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)]">
              <div className="text-center text-[var(--color-text-muted)]">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          } />
          <Route path="/:id" element={<ConversationView onModeChange={fetchConversations} />} />
        </Routes>
      </div>
    </div>
  );
}

function MessageSquare(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function ConversationView({ onModeChange }: { onModeChange: () => void }) {
  const { id } = useParams<{id: string}>();
  
  if (!id) return null;

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--color-border)]">
        <ChatWindow conversationId={id} onModeChange={onModeChange} />
      </div>
      <div className="hidden lg:block w-[300px] flex-shrink-0 bg-[var(--color-surface)] overflow-y-auto">
        <AICopilot conversationId={id} />
      </div>
    </>
  );
}
