
export interface ChatRequest {
  message: string;
  agentPrompt?: string;
  chatHistory?: any[];
  agentName?: string;
  isCustomAgent?: boolean;
  customAgentId?: string;
  productId?: string;
  userId: string;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{ text: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  type?: string;
  model?: string;
  error?: {
    message: string;
  };
}
