import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, X } from 'lucide-react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useOptimizedStreaming } from '@/hooks/useOptimizedStreaming';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { StreamingMessage } from '@/components/chat/StreamingMessage';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';
import { toast } from 'sonner';

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

const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 MODAL_${category}: ${message}`, data || '');
};

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionInitializedRef = useRef(false);
  
  debugLog('MODAL_RENDER', `🎯 Modal renderizado para agente: ${agent.name}`, { 
    agentId: agent.id, 
    isOpen 
  });
  
  // Memoizar o agentId para evitar recriações do hook
  const stableAgentId = useMemo(() => agent.id, [agent.id]);
  
  const {
    sessions,
    currentSession,
    messages,
    findOrCreateSessionForAgent,
    selectSession,
    addMessage,
    updateMessage,
    deleteSession
  } = useChatSessions(stableAgentId);

  // Memoizar o callback para evitar recriações
  const handleMessageComplete = useMemo(() => {
    return async (messageId: string, content: string) => {
      debugLog('MESSAGE_COMPLETE', '✅ Mensagem streaming completa recebida pelo modal', { 
        messageId, 
        contentLength: content.length,
        sessionId: currentSession?.id 
      });
      if (currentSession) {
        await updateMessage(messageId, content, true);
      }
    };
  }, [currentSession, updateMessage]);

  const {
    isConnected,
    isTyping,
    connectionStatus,
    isSending,
    currentStreamingMessage,
    currentMessageId,
    canSendMessage,
    sendMessage,
    reconnect
  } = useOptimizedStreaming(stableAgentId, handleMessageComplete);

  // Efeito para inicializar sessão APENAS uma vez quando o modal abrir
  useEffect(() => {
    if (isOpen && agent.id && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      debugLog('SESSION_INIT', '🎯 Inicializando sessão para agente', { agentId: agent.id, agentName: agent.name });
      findOrCreateSessionForAgent(agent.name);
    }
    
    // Reset quando modal fechar
    if (!isOpen) {
      sessionInitializedRef.current = false;
    }
  }, [isOpen, agent.id, agent.name, findOrCreateSessionForAgent]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, currentStreamingMessage]);

  // Focus automático no textarea quando o modal abre
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentSession]);

  const handleNewChat = useCallback(async () => {
    debugLog('NEW_CHAT', '🔄 Criando nova sessão', { agentName: agent.name, agentId: agent.id });
    await findOrCreateSessionForAgent(agent.name);
  }, [agent.name, agent.id, findOrCreateSessionForAgent]);

  const handleSend = useCallback(async () => {
    debugLog('SEND_ATTEMPT', '📤 Tentativa de envio', {
      hasMessage: !!message.trim(),
      canSendMessage,
      hasCurrentSession: !!currentSession,
      agentId: agent.id,
      connectionStatus,
      isConnected,
      isSending,
      isTyping
    });

    if (!message.trim() || !canSendMessage || !currentSession) {
      if (!canSendMessage) {
        debugLog('SEND_BLOCKED', '⚠️ Não é possível enviar: conexão não está pronta', {
          isConnected,
          connectionStatus,
          isSending,
          isTyping,
          canSendMessage
        });
        
        // Tentar reconectar se não estiver conectado
        if (!isConnected && connectionStatus !== 'connecting') {
          toast.info('Tentando reconectar...');
          reconnect();
        }
      }
      if (!currentSession) {
        debugLog('SEND_BLOCKED', '⚠️ Não é possível enviar: sem sessão atual');
      }
      if (!message.trim()) {
        debugLog('SEND_BLOCKED', '⚠️ Não é possível enviar: mensagem vazia');
      }
      return;
    }
    
    const messageToSend = message;
    setMessage('');
    
    debugLog('SEND_START', '🚀 Iniciando envio de mensagem', {
      messageLength: messageToSend.length,
      sessionId: currentSession.id,
      agentId: agent.id,
      agentName: agent.name
    });
    
    try {
      debugLog('USER_MESSAGE', '👤 Adicionando mensagem do usuário');
      await addMessage(currentSession.id, 'user', messageToSend);

      debugLog('ASSISTANT_MESSAGE', '🤖 Criando mensagem placeholder do assistente');
      const assistantMessage = await addMessage(currentSession.id, 'assistant', '', 0);

      debugLog('STREAMING_SEND', '📡 Enviando para streaming', {
        sessionId: currentSession.id,
        agentPrompt: agent.prompt,
        agentName: agent.name,
        isCustom: agent.isCustom
      });
      
      await sendMessage(
        currentSession.id,
        messageToSend,
        agent.prompt,
        agent.name,
        agent.isCustom
      );

      debugLog('SEND_SUCCESS', '✅ Mensagem enviada com sucesso');

    } catch (error) {
      debugLog('SEND_ERROR', '❌ Erro ao enviar mensagem', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setMessage(messageToSend);
      
      // Mostrar erro mais específico
      if (error instanceof Error) {
        if (error.message.includes('Tokens insuficientes')) {
          toast.error('Tokens insuficientes para continuar a conversa');
        } else if (error.message.includes('404') || error.message.includes('NO_ACTIVE_STREAM')) {
          toast.error('Conexão perdida. Reconectando...');
          reconnect();
        } else {
          toast.error(`Erro: ${error.message}`);
        }
      }
    }
  }, [
    message,
    canSendMessage,
    currentSession,
    agent.id,
    agent.name,
    agent.prompt,
    agent.isCustom,
    connectionStatus,
    isConnected,
    isSending,
    isTyping,
    addMessage,
    sendMessage,
    reconnect
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      debugLog('KEYBOARD_SEND', '⌨️ Enviando via Enter');
      handleSend();
    }
  }, [handleSend]);

  const exportChat = useCallback(() => {
    if (messages.length === 0 || !currentSession) return;

    debugLog('EXPORT_CHAT', '📁 Exportando chat', {
      messageCount: messages.length,
      sessionTitle: currentSession.title
    });

    const chatContent = messages.map(msg => {
      const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
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
  }, [messages, currentSession, agent.name]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-[#1E1E1E] border-[#4B5563]/20 text-white max-w-7xl w-full h-[90vh] flex p-0"
        hideCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Chat com {agent.name}</DialogTitle>
        </DialogHeader>

        {/* Sidebar */}
        <ChatSidebar
          sessions={sessions}
          currentSession={currentSession}
          agentName={agent.name}
          agentIcon={agent.icon}
          onNewChat={handleNewChat}
          onSelectSession={selectSession}
          onDeleteSession={deleteSession}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#4B5563]/20">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
              }`}>
                <agent.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{agent.name}</h3>
                <ConnectionStatus 
                  status={connectionStatus} 
                  isTyping={isTyping}
                  onReconnect={reconnect}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportChat}
                disabled={messages.length === 0}
                className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#CCCCCC] hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {!currentSession ? (
                <div className="text-center text-[#888888] py-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                    agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                  }`}>
                    <agent.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{agent.name}</h3>
                  <p className="text-[#CCCCCC] mb-4">{agent.description}</p>
                  {connectionStatus === 'connecting' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce"></div>
                      <span className="text-sm ml-2">Conectando...</span>
                    </div>
                  ) : connectionStatus === 'error' ? (
                    <div className="space-y-2">
                      <p className="text-red-400 text-sm">Erro na conexão</p>
                      <Button
                        onClick={reconnect}
                        size="sm"
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">Inicializando conversa...</p>
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-[#888888] py-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                    agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                  }`}>
                    <agent.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{agent.name}</h3>
                  <p className="text-[#CCCCCC] mb-4">{agent.description}</p>
                  <p className="text-sm">Como posso ajudar você hoje?</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <StreamingMessage 
                      key={msg.id} 
                      message={{
                        id: msg.id,
                        content: msg.content,
                        role: msg.role,
                        timestamp: new Date(msg.created_at),
                        isStreaming: !msg.streaming_complete
                      }}
                      isLast={index === messages.length - 1}
                    />
                  ))}
                  
                  {/* Mensagem de streaming em tempo real */}
                  {isTyping && currentMessageId && currentStreamingMessage && (
                    <StreamingMessage 
                      message={{
                        id: currentMessageId,
                        content: currentStreamingMessage,
                        role: 'assistant',
                        timestamp: new Date(),
                        isStreaming: true
                      }}
                      isLast={true}
                    />
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-[#4B5563]/20 p-6">
            <div className="flex space-x-3">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mensagem para ${agent.name}...`}
                className="flex-1 min-h-[44px] max-h-32 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none"
                disabled={!canSendMessage || !currentSession}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || !canSendMessage || !currentSession}
                size="lg"
                className={`px-6 transition-all duration-200 ${
                  isSending 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : (canSendMessage && message.trim())
                    ? 'bg-[#3B82F6] hover:bg-[#2563EB]'
                    : 'bg-gray-500'
                } text-white`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Status melhorado */}
            {(!canSendMessage || connectionStatus !== 'connected') && (
              <div className="mt-3 text-sm flex items-center justify-center">
                {isSending ? (
                  <div className="text-[#3B82F6] flex items-center">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse mr-2"></div>
                    Enviando mensagem...
                  </div>
                ) : connectionStatus === 'connecting' ? (
                  <div className="text-yellow-500 flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                    Conectando ao assistente...
                  </div>
                ) : connectionStatus === 'error' ? (
                  <div className="text-red-500 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Erro de conexão</span>
                    <Button
                      onClick={reconnect}
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      Reconectar
                    </Button>
                  </div>
                ) : !isConnected ? (
                  <div className="text-red-500 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    Sem conexão - aguarde ou reconecte
                  </div>
                ) : isTyping ? (
                  <div className="text-blue-500 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                    Assistente está respondendo...
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
