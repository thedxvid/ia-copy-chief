
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target, Trash2 } from 'lucide-react';
import { useFloatingChat } from '@/hooks/useFloatingChat';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { useAuth } from '@/contexts/AuthContext';
import { AgentSelector } from './AgentSelector';
import { ChatWindow } from './ChatWindow';

export const FloatingAgentChat: React.FC = () => {
  const { user } = useAuth();
  const {
    chatStep,
    openAgents,
    activeAgentId,
    openAgentSelection,
    selectAgent,
    backToSelection,
    closeChat,
    closeAgent,
    minimizeAgent,
    maximizeAgent,
    incrementUnread,
    focusAgent,
  } = useFloatingChat();

  const { agents: customAgents } = useCustomAgents();

  const iconMap: Record<string, React.ComponentType<any>> = {
    Bot, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target, MessageSquare
  };

  const defaultAgents = [
    {
      id: 'copy',
      name: 'Agente Copy',
      description: 'Especialista em criação de copies persuasivas',
      icon: MessageSquare,
      prompt: 'Você é um especialista em copywriting persuasivo. Sua missão é criar textos que convertem, utilizando técnicas comprovadas de persuasão, gatilhos mentais e estruturas de copy que geram resultados. Sempre analise o público-alvo, objetivo da campanha e contexto antes de criar qualquer texto.',
      isDefault: true
    },
    {
      id: 'headlines',
      name: 'Agente Headlines',
      description: 'Focado em criar headlines impactantes',
      icon: Zap,
      prompt: 'Você é um especialista em headlines que geram cliques e conversões. Domina técnicas como curiosidade, urgência, benefício específico, prova social e gatilhos emocionais. Sempre cria múltiplas variações e explica por que cada headline funciona para o público específico.',
      isDefault: true
    },
    {
      id: 'scripts',
      name: 'Agente Scripts',
      description: 'Especializado em roteiros para vídeos de vendas',
      icon: Bot,
      prompt: 'Você é um roteirista especializado em vídeos de vendas e apresentações persuasivas. Domina estruturas como AIDA, PAS, storytelling e técnicas de apresentação que mantêm o público engajado e conduzem à ação. Sempre considera o tempo de atenção e objetivos específicos.',
      isDefault: true
    }
  ];

  const formatCustomAgent = (agent: any) => ({
    ...agent,
    icon: iconMap[agent.icon_name] || Bot,
    isCustom: true
  });

  const allAgents = [
    ...defaultAgents,
    ...customAgents.map(formatCustomAgent)
  ];

  // Debug function to clear all chat histories
  const clearAllChats = () => {
    if (window.confirm('⚠️ Isso irá limpar TODOS os históricos de chat. Tem certeza?')) {
      console.log('🗑️ Clearing all chat histories...');
      
      // Clear localStorage for all agents
      allAgents.forEach(agent => {
        localStorage.removeItem(`chat-${agent.id}`);
        console.log(`Removed chat history for agent: ${agent.id}`);
      });
      
      // Clear any orphaned chat data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat-')) {
          localStorage.removeItem(key);
          console.log(`Removed orphaned chat data: ${key}`);
        }
      });
      
      console.log('✅ All chat histories cleared!');
      alert('✅ Todos os históricos de chat foram limpos! Recarregue a página para ver o efeito.');
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatStep !== 'closed') {
        closeChat();
      }
      
      // Teclas numéricas para alternar entre chats (1, 2, 3)
      if (e.key >= '1' && e.key <= '3' && e.ctrlKey && openAgents.length > 0) {
        const index = parseInt(e.key) - 1;
        if (index < openAgents.length) {
          const agent = openAgents[index];
          if (agent.isMinimized) {
            maximizeAgent(agent.id);
          } else {
            focusAgent(agent.id);
          }
        }
      }

      // Debug shortcut: Ctrl+Shift+D to clear all chats
      if (e.key === 'D' && e.ctrlKey && e.shiftKey) {
        clearAllChats();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [chatStep, closeChat, openAgents, maximizeAgent, focusAgent]);

  // Só renderizar se o usuário estiver logado
  if (!user) {
    return null;
  }

  // Calcular total de notificações
  const totalUnreadCount = openAgents.reduce((sum, agent) => sum + agent.unreadCount, 0);

  // Don't render anything if chat is closed and no agents are open
  if (chatStep === 'closed' && openAgents.length === 0) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end space-y-2">
          {/* Debug button - only show in development */}
          {window.location.hostname === 'localhost' && (
            <Button
              onClick={clearAllChats}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
              title="Debug: Clear All Chats (Ctrl+Shift+D)"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={openAgentSelection}
            className="w-14 h-14 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
          >
            <Bot className="w-6 h-6" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Agent Selection Modal */}
      {chatStep === 'agent-selection' && (
        <AgentSelector
          agents={allAgents}
          onSelectAgent={selectAgent}
          onClose={closeChat}
        />
      )}
      
      {/* Active Chat Windows */}
      {chatStep === 'chatting' && openAgents.length > 0 && (
        <div className="flex flex-col space-y-4">
          {/* Minimized Agents Dock */}
          {openAgents.some(agent => agent.isMinimized) && (
            <div className="flex space-x-2 justify-end">
              {openAgents
                .filter(agent => agent.isMinimized)
                .map((agent, index) => (
                  <Button
                    key={agent.id}
                    onClick={() => maximizeAgent(agent.id)}
                    className="h-10 px-3 rounded-lg bg-[#2A2A2A] hover:bg-[#3B82F6] text-white shadow-lg transition-all duration-200 flex items-center space-x-2 relative"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                    }`}>
                      <agent.icon className="w-2 h-2 text-white" />
                    </div>
                    <span className="text-xs font-medium truncate max-w-20">
                      {agent.name}
                    </span>
                    {agent.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {agent.unreadCount > 9 ? '9+' : agent.unreadCount}
                      </span>
                    )}
                  </Button>
                ))}
            </div>
          )}

          {/* Active Chat Windows */}
          <div className="flex flex-col space-y-4">
            {openAgents
              .filter(agent => !agent.isMinimized)
              .map((agent, index) => (
                <div
                  key={agent.id}
                  className={`transition-all duration-200 ${
                    activeAgentId === agent.id ? 'z-20' : 'z-10 opacity-90'
                  }`}
                  style={{
                    transform: index > 0 ? `translateX(-${index * 20}px) translateY(-${index * 20}px)` : 'none'
                  }}
                >
                  <ChatWindow
                    agent={agent}
                    onBack={backToSelection}
                    onMinimize={() => minimizeAgent(agent.id)}
                    onClose={() => closeAgent(agent.id)}
                    onNewMessage={() => incrementUnread(agent.id)}
                    onFocus={() => focusAgent(agent.id)}
                    isActive={activeAgentId === agent.id}
                  />
                </div>
              ))}
          </div>

          {/* Floating Action Button for New Chat */}
          <div className="flex justify-end space-x-2">
            {/* Debug button - only show in development */}
            {window.location.hostname === 'localhost' && (
              <Button
                onClick={clearAllChats}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
                title="Debug: Clear All Chats (Ctrl+Shift+D)"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={openAgentSelection}
              className="w-12 h-12 rounded-full bg-[#10B981] hover:bg-[#059669] text-white shadow-lg hover:shadow-xl transition-all duration-200"
              title="Abrir novo chat"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
