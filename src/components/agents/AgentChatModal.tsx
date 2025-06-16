
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatSessions } from '@/hooks/useChatSessions';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MobileChatSidebar } from '@/components/chat/MobileChatSidebar';
import { MessageComponent } from './MessageComponent';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface AgentChatModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Sistema de logs para o modal
const modalLogger = {
  log: (action: string, data?: any) => {
    console.log(`[MODAL] ${new Date().toISOString()} - ${action}:`, data || '');
  },
  error: (action: string, error: any) => {
    console.error(`[MODAL ERROR] ${new Date().toISOString()} - ${action}:`, error);
  }
};

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const isMobile = useMobileDetection();
  const mountedRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  
  const {
    sessions,
    currentSession,
    messages: sessionMessages,
    findOrCreateSessionForAgent,
    selectSession,
    addMessage,
    deleteSession,
    createNewSession,
    validateState,
    recoverFromError
  } = useChatSessions(agent.id);

  modalLogger.log('MODAL_RENDER', {
    agentId: agent.id,
    agentName: agent.name,
    currentSessionId: currentSession?.id,
    messagesCount: sessionMessages.length,
    isOpen,
    isMobile,
    isSidebarOpen
  });

  // Converter mensagens da sessão para o formato Message
  const allMessages: Message[] = sessionMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.created_at)
  }));

  // Função de renderização limpa do chat
  const renderChatInterface = useCallback(() => {
    modalLogger.log('RENDERING_CHAT_INTERFACE', {
      currentSessionId: currentSession?.id,
      messagesCount: allMessages.length
    });

    // Auto-scroll apenas se houver novas mensagens
    if (allMessages.length > lastMessageCountRef.current && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
      lastMessageCountRef.current = allMessages.length;
    }
  }, [allMessages.length, currentSession?.id]);

  // Função de limpeza da interface
  const clearChatInterface = useCallback(() => {
    modalLogger.log('CLEARING_CHAT_INTERFACE');
    setMessage('');
    setIsLoading(false);
    lastMessageCountRef.current = 0;
  }, []);

  // Auto-scroll otimizado
  useEffect(() => {
    renderChatInterface();
  }, [renderChatInterface]);

  // Focus automático no textarea
  useEffect(() => {
    if (isOpen && textareaRef.current && !isMobile && currentSession) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMobile, currentSession]);

  // Inicializar sessão quando o modal abrir
  useEffect(() => {
    if (isOpen && agent.id && user?.id) {
      modalLogger.log('INITIALIZING_SESSION', { agentName: agent.name });
      
      // Validar estado antes de inicializar
      if (!validateState()) {
        modalLogger.error('INVALID_STATE_DETECTED', 'Recuperando...');
        recoverFromError();
      }
      
      findOrCreateSessionForAgent(agent.name);
    }
  }, [isOpen, agent.id, agent.name, user?.id, findOrCreateSessionForAgent, validateState, recoverFromError]);

  // Cleanup ao fechar
  useEffect(() => {
    if (!isOpen) {
      clearChatInterface();
      setIsSidebarOpen(false);
    }
  }, [isOpen, clearChatInterface]);

  // Fechar sidebar automaticamente em mobile quando uma sessão for selecionada
  useEffect(() => {
    if (isMobile && isSidebarOpen && currentSession) {
      setIsSidebarOpen(false);
    }
  }, [currentSession, isMobile, isSidebarOpen]);

  // Cleanup geral
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      modalLogger.log('MODAL_UNMOUNTED');
    };
  }, []);

  const handleNewChat = async () => {
    if (!mountedRef.current) return;
    
    modalLogger.log('NEW_CHAT_REQUESTED');
    setIsCreatingSession(true);
    
    try {
      clearChatInterface();
      const newSession = await createNewSession(agent.name);
      
      if (newSession && mountedRef.current) {
        toast.success('✨ Nova conversa iniciada!', {
          description: 'Uma nova conversa foi criada com sucesso.'
        });
        modalLogger.log('NEW_SESSION_CREATED', { sessionId: newSession.id });
      }
    } catch (error) {
      modalLogger.error('NEW_CHAT_ERROR', error);
      if (mountedRef.current) {
        toast.error('❌ Erro ao criar nova conversa', {
          description: 'Tente novamente em alguns instantes.'
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsCreatingSession(false);
      }
    }
  };

  const sendMessageToAI = async (userMessage: string) => {
    if (!user?.id || !currentSession || !mountedRef.current) {
      modalLogger.error('SEND_MESSAGE_INVALID_STATE', {
        hasUser: !!user?.id,
        hasSession: !!currentSession,
        mounted: mountedRef.current
      });
      return;
    }

    modalLogger.log('SENDING_MESSAGE_TO_AI', {
      sessionId: currentSession.id,
      messagePreview: userMessage.substring(0, 50) + '...',
      historyCount: sessionMessages.length
    });

    try {
      // Preparar histórico de mensagens
      const recentMessages = sessionMessages.slice(-15);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Chamar a edge function
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          message: userMessage,
          agentPrompt: agent.prompt,
          agentName: agent.name,
          userId: user.id,
          sessionId: currentSession.id,
          conversationHistory: conversationHistory,
          isCustomAgent: agent.isCustom || false,
          streaming: false
        }
      });

      if (error) {
        modalLogger.error('AI_RESPONSE_ERROR', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!data?.response) {
        modalLogger.error('AI_EMPTY_RESPONSE');
        throw new Error('A IA retornou uma resposta vazia');
      }

      modalLogger.log('AI_RESPONSE_RECEIVED', {
        responseLength: data.response.length,
        tokensUsed: data.tokensUsed || 0
      });

      // Adicionar resposta da IA
      if (mountedRef.current) {
        await addMessage(currentSession.id, 'assistant', data.response, data.tokensUsed || 0);
      }

    } catch (error) {
      modalLogger.error('SEND_MESSAGE_EXCEPTION', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para conversar com o agente.',
        });
      } else {
        toast.error('❌ Erro no Chat', {
          description: errorMessage,
        });
      }
      throw error;
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading || !currentSession || !mountedRef.current) {
      modalLogger.log('SEND_BLOCKED', { 
        hasMessage: !!message.trim(), 
        isLoading, 
        hasSession: !!currentSession,
        mounted: mountedRef.current
      });
      return;
    }
    
    const messageToSend = message.trim();
    setMessage('');
    setIsLoading(true);
    
    modalLogger.log('SENDING_MESSAGE', { messagePreview: messageToSend.substring(0, 50) + '...' });
    
    try {
      // Adicionar mensagem do usuário
      await addMessage(currentSession.id, 'user', messageToSend);
      
      // Enviar para IA
      await sendMessageToAI(messageToSend);
      
      modalLogger.log('MESSAGE_FLOW_COMPLETED');

    } catch (error) {
      modalLogger.error('SEND_MESSAGE_FLOW_ERROR', error);
      // Restaurar mensagem no campo se houver erro
      if (mountedRef.current) {
        setMessage(messageToSend);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportChat = () => {
    if (allMessages.length === 0 || !currentSession) return;

    const chatContent = allMessages.map(msg => {
      const time = msg.timestamp.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const role = msg.role === 'user' ? 'Você' : agent.name;
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${agent.name}-${currentSession.title || 'conversa'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    modalLogger.log('TOGGLE_SIDEBAR', { 
      current: isSidebarOpen, 
      new: !isSidebarOpen,
      isMobile 
    });
    
    setIsSidebarOpen(prev => !prev);
  };

  const handleCloseSidebar = () => {
    modalLogger.log('CLOSE_SIDEBAR');
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (session: any) => {
    modalLogger.log('SESSION_SELECTED', { sessionId: session.id });
    clearChatInterface();
    selectSession(session);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`bg-[#1E1E1E] border-[#4B5563]/20 text-white ${
          isMobile 
            ? 'max-w-full w-full h-full max-h-screen m-0 rounded-none p-0' 
            : 'max-w-7xl w-full h-[90vh] p-0'
        } overflow-hidden`}
        hideCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Chat com {agent.name}</DialogTitle>
        </DialogHeader>

        <div className="flex h-full w-full">
          {/* Sidebar Desktop */}
          {!isMobile && (
            <ChatSidebar
              sessions={sessions}
              currentSession={currentSession}
              agentName={agent.name}
              agentIcon={agent.icon}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onDeleteSession={deleteSession}
              isLoading={isCreatingSession}
            />
          )}

          {/* Mobile Sidebar - Overlay quando aberta */}
          {isMobile && (
            <MobileChatSidebar
              sessions={sessions}
              currentSession={currentSession}
              agentName={agent.name}
              agentIcon={agent.icon}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onDeleteSession={deleteSession}
              isLoading={isCreatingSession}
              isOpen={isSidebarOpen}
              onClose={handleCloseSidebar}
            />
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Header */}
            <ChatHeader
              agent={agent}
              isLoading={isLoading}
              isCreatingSession={isCreatingSession}
              currentSession={currentSession}
              allMessages={allMessages}
              onToggleSidebar={handleToggleSidebar}
              onExportChat={exportChat}
              onClose={onClose}
            />

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 sm:px-6" ref={scrollAreaRef}>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                <EmptyState 
                  agent={agent}
                  currentSession={currentSession}
                  hasMessages={allMessages.length > 0}
                />
                
                {allMessages.map((msg) => (
                  <MessageComponent 
                    key={msg.id} 
                    message={msg}
                    agentName={agent.name}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput
              agent={agent}
              message={message}
              isLoading={isLoading}
              isCreatingSession={isCreatingSession}
              currentSession={currentSession}
              textareaRef={textareaRef}
              onMessageChange={setMessage}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
