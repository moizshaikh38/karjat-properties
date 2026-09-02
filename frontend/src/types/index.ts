export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'agent';
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  classification: 'HOT' | 'WARM' | 'COLD';
  temperature?: 'COLD' | 'WARM' | 'HOT' | 'VERY_HOT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lead_score: number;
  status: string;
  assigned_to?: string;
}

export interface Conversation {
  id: string;
  whatsapp_phone: string;
  mode: 'ai' | 'human' | 'paused';
  status: string;
  last_message_at: string;
  lead?: Lead;
}

export interface Message {
  id: string;
  whatsapp_message_id: string;
  direction: 'incoming' | 'outgoing';
  text_content: string;
  status: string;
  created_at: string;
}
