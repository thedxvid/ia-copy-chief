
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface ChatSession {
  id: string;
  agent_id: string;
  agent_name: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count: number;
}

interface ChatInputProps {
  agent: Agent;
  message: string;
  isLoading: boolean;
  isCreatingSession: boolean;
  currentSession: ChatSession | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  agent,
  message,
  isLoading,
  isCreatingSession,
  currentSession,
  textareaRef,
  onMessageChange,
  onSend,
  onKeyDown
}) => {
  const isMobile = useMobileDetection();

  return (
    <div className="border-t border-[#4B5563]/20 p-3 sm:p-6">
      <div className="flex space-x-2 sm:space-x-3">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Mensagem para ${agent.name}...`}
          className={`flex-1 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none text-sm sm:text-base ${
            isMobile ? 'min-h-[60px] max-h-32' : 'min-h-[44px] max-h-32'
          }`}
          disabled={isLoading || !currentSession || isCreatingSession}
        />
        <Button
          onClick={onSend}
          disabled={!message.trim() || isLoading || !currentSession || isCreatingSession}
          size={isMobile ? "default" : "lg"}
          className={`transition-all duration-200 flex-shrink-0 ${
            isMobile ? 'px-4 min-h-[60px] min-w-[60px]' : 'px-6'
          } ${
            isLoading 
              ? 'bg-orange-500 hover:bg-orange-600' 
              : (message.trim() && currentSession && !isCreatingSession)
              ? 'bg-[#3B82F6] hover:bg-[#2563EB]'
              : 'bg-gray-500'
          } text-white disabled:opacity-50`}
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
      
      {(isLoading || isCreatingSession) && (
        <div className="mt-3 text-sm text-center">
          <div className="text-[#3B82F6] flex items-center justify-center">
            <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse mr-2"></div>
            {isCreatingSession ? 'Criando nova conversa...' : `${agent.name} está pensando...`}
          </div>
        </div>
      )}
    </div>
  );
};
