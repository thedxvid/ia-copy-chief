
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

  // Debug detalhado do estado atual
  useEffect(() => {
    console.log('🎭 === FLOATING CHAT RENDER STATE === 🎭');
    console.log('chatStep:', chatStep);
    console.log('openAgents count:', openAgents.length);
    console.log('activeAgentId:', activeAgentId);
    console.log('user:', !!user);
    
    if (openAgents.length > 0) {
      console.log('Open agents details:', openAgents.map(a => ({ id: a.id, name: a.name, minimized: a.isMinimized })));
    }
    
    const shouldRenderChat = chatStep === 'chatting' && openAgents.length > 0;
    console.log('🔍 SHOULD RENDER CHAT?', shouldRenderChat);
    console.log('🔍 Render conditions:');
    console.log('  - chatStep === "chatting":', chatStep === 'chatting');
    console.log('  - openAgents.length > 0:', openAgents.length > 0);
  }, [chatStep, openAgents, activeAgentId, user]);

  // Só renderizar se o usuário estiver logado
  if (!user) {
    console.log('❌ User not logged in, not rendering chat');
    return null;
  }

  // Calcular total de notificações
  const totalUnreadCount = openAgents.reduce((sum, agent) => sum + agent.unreadCount, 0);

  // Debug função para limpar chats
  const clearAllChats = () => {
    if (window.confirm('⚠️ Isso irá limpar TODOS os históricos de chat. Tem certeza?')) {
      allAgents.forEach(agent => {
        localStorage.removeItem(`chat-${agent.id}`);
      });
      alert('✅ Todos os históricos foram limpos!');
    }
  };

  console.log('🎨 RENDER DECISION - chatStep:', chatStep, 'openAgents:', openAgents.length);

  // Estado: Apenas botão principal
  if (chatStep === 'closed') {
    console.log('🔵 Rendering: Main button only');
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end space-y-2">
          {window.location.hostname === 'localhost' && (
            <Button
              onClick={clearAllChats}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
              title="Debug: Clear All Chats"
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

  // Estado: Seleção de agentes
  if (chatStep === 'agent-selection') {
    console.log('🟡 Rendering: Agent selection modal');
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <AgentSelector
          agents={allAgents}
          onSelectAgent={selectAgent}
          onClose={closeChat}
        />
      </div>
    );
  }

  // Estado: Chat ativo - SEMPRE renderizar quando chatStep === 'chatting' E temos agentes
  if (chatStep === 'chatting') {
    console.log('🟢 ATTEMPTING CHAT RENDER - openAgents:', openAgents.length);
    
    // Se não há agentes abertos mas estamos em chatting, algo está errado
    if (openAgents.length === 0) {
      console.log('⚠️ CRITICAL: No open agents in chatting state!');
      console.log('⚠️ Forçando volta para closed...');
      setTimeout(() => closeChat(), 0);
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-yellow-500 text-black p-2 rounded">
            Debug: Tentando corrigir estado...
          </div>
        </div>
      );
    }
    
    console.log('✅ RENDERING CHAT INTERFACE with', openAgents.length, 'agents');
    
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-4">
          {/* Agentes Minimizados */}
          {openAgents.some(agent => agent.isMinimized) && (
            <div className="flex space-x-2 justify-end">
              {openAgents
                .filter(agent => agent.isMinimized)
                .map((agent) => (
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

          {/* Janelas de Chat Ativas */}
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

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2">
            {window.location.hostname === 'localhost' && (
              <Button
                onClick={clearAllChats}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
                title="Debug: Clear All Chats"
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
      </div>
    );
  }

  // Fallback - não deveria acontecer
  console.log('🔴 Rendering: Fallback (unexpected state)', { chatStep, openAgentsLength: openAgents.length });
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-red-500 text-white p-2 rounded">
        Debug: Estado inesperado - {chatStep} / {openAgents.length}
      </div>
    </div>
  );
};
