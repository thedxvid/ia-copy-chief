
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Calendar } from 'lucide-react';

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

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  agentName: string;
  agentIcon: any;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSession,
  agentName,
  agentIcon: AgentIcon,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isLoading = false
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const getTitleDisplay = (session: ChatSession) => {
    if (session.title) {
      return session.title;
    }
    if (session.message_count === 0) {
      return 'Nova conversa';
    }
    return `Conversa ${session.id.slice(0, 8)}...`;
  };

  return (
    <div className="w-80 bg-[#1A1A1A] border-r border-[#4B5563]/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#4B5563]/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center">
            <AgentIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{agentName}</h2>
            <p className="text-sm text-[#888888]">Conversas</p>
          </div>
        </div>
        
        <Button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Lista de Conversas */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-[#888888]">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma conversa ainda</p>
              <p className="text-xs mt-1">Clique em "Nova Conversa" para começar</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentSession?.id === session.id
                      ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/30'
                      : 'hover:bg-[#2A2A2A] border border-transparent'
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-3 h-3 text-[#888888] flex-shrink-0" />
                      <p className={`text-sm font-medium truncate ${
                        currentSession?.id === session.id ? 'text-white' : 'text-[#CCCCCC]'
                      }`}>
                        {getTitleDisplay(session)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-[#888888]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(session.updated_at)}</span>
                      </div>
                      <span>•</span>
                      <span>{session.message_count} mensagens</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 text-[#888888] hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-[#4B5563]/20">
        <div className="text-xs text-[#888888] text-center">
          {sessions.length} conversa{sessions.length !== 1 ? 's' : ''} salva{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
