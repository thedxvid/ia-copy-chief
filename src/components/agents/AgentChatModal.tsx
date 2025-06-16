
import React, { useState, useRef, useEffect } from 'react';
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

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    sessions,
    currentSession,
    messages,
    createNewSession,
    selectSession,
    addMessage,
    updateMessage,
    deleteSession
  } = useChatSessions(agent.id);

  const handleMessageComplete = async (messageId: string, content: string) => {
    if (currentSession) {
      await updateMessage(messageId, content, true);
    }
  };

  const {
    isConnected,
    isTyping,
    connectionStatus,
    isSending,
    currentStreamingMessage,
    currentMessageId,
    sendMessage,
    reconnect
  } = useOptimizedStreaming(agent.id, handleMessageComplete);

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

  const handleNewChat = async () => {
    await createNewSession(agent.name);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending || isTyping || !currentSession) return;
    
    // MELHORADO: Verificar se está conectado antes de enviar
    if (!isConnected) {
      console.warn('⚠️ Tentando enviar sem conexão ativa, aguardando...');
      return;
    }
    
    const messageToSend = message;
    setMessage(''); // Limpar input imediatamente
    
    try {
      // Adicionar mensagem do usuário ao banco
      await addMessage(currentSession.id, 'user', messageToSend);

      // Criar mensagem placeholder para o assistente
      const assistantMessage = await addMessage(currentSession.id, 'assistant', '', 0);

      // Enviar para streaming
      await sendMessage(
        currentSession.id,
        messageToSend,
        agent.prompt,
        agent.name,
        agent.isCustom
      );

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessage(messageToSend); // Restaurar mensagem em caso de erro
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportChat = () => {
    if (messages.length === 0 || !currentSession) return;

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
  };

  // Automaticamente criar nova sessão se não existir nenhuma
  useEffect(() => {
    if (isOpen && sessions.length === 0 && !currentSession) {
      handleNewChat();
    }
  }, [isOpen, sessions.length, currentSession]);

  // Determinar se pode enviar mensagem
  const canSendMessage = message.trim() && !isSending && !isTyping && isConnected && currentSession;

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
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce"></div>
                    <span className="text-sm ml-2">Preparando conversa...</span>
                  </div>
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
                disabled={isSending || isTyping || !isConnected || !currentSession}
              />
              <Button
                onClick={handleSend}
                disabled={!canSendMessage}
                size="lg"
                className={`px-6 transition-all duration-200 ${
                  isSending 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : isConnected
                    ? 'bg-[#3B82F6] hover:bg-[#2563EB]'
                    : 'bg-gray-500'
                } text-white`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {/* Status mais detalhado */}
            {(!isConnected || isSending) && (
              <div className="mt-3 text-sm flex items-center justify-center">
                {isSending ? (
                  <div className="text-[#3B82F6] flex items-center">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse mr-2"></div>
                    Enviando mensagem...
                  </div>
                ) : !isConnected ? (
                  <div className="text-yellow-500 flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                    {connectionStatus === 'connecting' ? 'Conectando...' : 'Aguardando conexão...'}
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
