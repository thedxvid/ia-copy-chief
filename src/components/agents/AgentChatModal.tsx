import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, X, Bot, User, Copy, Check, Menu } from 'lucide-react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MobileChatSidebar } from '@/components/chat/MobileChatSidebar';
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

const MessageComponent: React.FC<{ message: Message; agentName: string }> = ({ message, agentName }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isMobile = useMobileDetection();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex gap-2 sm:gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
      )}
      
      <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[70%]'} ${isUser ? 'order-1' : ''}`}>
        <div className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 transition-all duration-200 ${
          isUser 
            ? 'bg-[#3B82F6] text-white ml-auto' 
            : 'bg-[#2A2A2A] text-white border border-[#4B5563]/20'
        }`}>
          <div className="whitespace-pre-wrap break-words text-sm sm:text-base">
            {message.content}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-[#888888] ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {!isUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-auto p-1 text-[#888888] hover:text-white transition-colors min-h-[44px] sm:min-h-auto"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2A2A2A] rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-[#4B5563]/20">
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
      )}
    </div>
  );
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

  const handleSelectSession = async (session: any) => {
    modalLogger.log('SESSION_SELECTED', { sessionId: session.id });
    clearChatInterface();
    await selectSession(session);
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

        {/* Container interno com flex para organizar sidebar + chat */}
        <div className="flex h-full w-full relative">
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
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#4B5563]/20">
              {/* ... keep existing code (header content) */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleSidebar}
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
                    onClick={exportChat}
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

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 sm:px-6" ref={scrollAreaRef}>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                {!currentSession ? (
                  <div className="text-center text-[#888888] py-8">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                      agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                    }`}>
                      <agent.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2">{agent.name}</h3>
                    <p className="text-sm sm:text-base text-[#CCCCCC] mb-4 px-4">{agent.description}</p>
                    <p className="text-xs sm:text-sm">Inicializando conversa...</p>
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="text-center text-[#888888] py-8">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                      agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                    }`}>
                      <agent.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2">{agent.name}</h3>
                    <p className="text-sm sm:text-base text-[#CCCCCC] mb-4 px-4">{agent.description}</p>
                    <p className="text-xs sm:text-sm">Como posso ajudar você hoje?</p>
                  </div>
                ) : (
                  allMessages.map((msg) => (
                    <MessageComponent 
                      key={msg.id} 
                      message={msg}
                      agentName={agent.name}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-[#4B5563]/20 p-3 sm:p-6">
              <div className="flex space-x-2 sm:space-x-3">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Mensagem para ${agent.name}...`}
                  className={`flex-1 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none text-sm sm:text-base ${
                    isMobile ? 'min-h-[60px] max-h-32' : 'min-h-[44px] max-h-32'
                  }`}
                  disabled={isLoading || !currentSession || isCreatingSession}
                />
                <Button
                  onClick={handleSend}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
