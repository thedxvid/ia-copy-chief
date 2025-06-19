
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
