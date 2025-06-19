
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  session_id?: string;
  tokens_used?: number;
  model_used?: string;
  is_error?: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  title?: string;
  messages: ChatMessage[];
  agent_id?: string;
  agent_name?: string;
  product_id?: string;
  message_count?: number;
  is_active?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface ChatState {
  messages: ChatMessage[];
  selectedAgent: Agent | null;
  isLoading: boolean;
}
