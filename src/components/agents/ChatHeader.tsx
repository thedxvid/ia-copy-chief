
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Menu } from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

interface ChatHeaderProps {
  agent: Agent;
  isLoading: boolean;
  isCreatingSession: boolean;
  currentSession: ChatSession | null;
  allMessages: Message[];
  onToggleSidebar: (e: React.MouseEvent) => void;
  onExportChat: () => void;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agent,
  isLoading,
  isCreatingSession,
  currentSession,
  allMessages,
  onToggleSidebar,
  onExportChat,
  onClose
}) => {
  const isMobile = useMobileDetection();

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#4B5563]/20">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-[#CCCCCC] hover:text-white hover:bg-[#3B82F6]/20 flex-shrink-0 w-10 h-10 min-h-[44px] min-w-[44px] touch-manipulation border border-[#4B5563]/20 transition-all duration-200"
            aria-label="Abrir histórico de conversas"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
        }`}>
          <agent.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">{agent.name}</h3>
          <p className="text-xs sm:text-sm text-[#888888]">
            {isLoading ? 'Processando...' : isCreatingSession ? 'Criando nova conversa...' : 'Online'}
          </p>
        </div>
      </div>
      
      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
        {!isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportChat}
            disabled={allMessages.length === 0}
            className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] text-xs"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-[#CCCCCC] hover:text-white w-8 h-8 sm:w-10 sm:h-10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
