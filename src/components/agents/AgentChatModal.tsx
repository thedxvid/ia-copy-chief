
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, X, Bot, User, Copy, Check } from 'lucide-react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

const MessageComponent: React.FC<{ message: Message; agentName: string }> = ({ message, agentName }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

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
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 transition-all duration-200 ${
          isUser 
            ? 'bg-[#3B82F6] text-white ml-auto' 
            : 'bg-[#2A2A2A] text-white border border-[#4B5563]/20'
        }`}>
          <div className="whitespace-pre-wrap break-words">
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
              className="h-auto p-1 text-[#888888] hover:text-white transition-colors"
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
        <div className="w-8 h-8 bg-[#2A2A2A] rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-[#4B5563]/20">
          <User className="w-4 h-4 text-white" />
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  
  const {
    sessions,
    currentSession,
    messages: sessionMessages,
    findOrCreateSessionForAgent,
    selectSession,
    addMessage,
    deleteSession,
    createNewSession
  } = useChatSessions(agent.id);

  console.log('🔍 AgentChatModal - Estado atual:', {
    agentId: agent.id,
    agentName: agent.name,
    currentSessionId: currentSession?.id,
    messagesCount: sessionMessages.length,
    isLoading
  });

  // Converter mensagens da sessão para o formato Message
  const allMessages: Message[] = sessionMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.created_at)
  }));

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [allMessages]);

  // Focus automático no textarea quando o modal abre
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Inicializar sessão quando o modal abrir
  useEffect(() => {
    if (isOpen && agent.id) {
      console.log('🚀 Inicializando sessão para agente:', agent.name);
      findOrCreateSessionForAgent(agent.name);
    }
  }, [isOpen, agent.id, agent.name, findOrCreateSessionForAgent]);

  const handleNewChat = async () => {
    console.log('🔄 Iniciando nova conversa');
    try {
      await createNewSession(agent.name);
      toast.success('Nova conversa iniciada!');
    } catch (error) {
      console.error('❌ Erro ao criar nova conversa:', error);
      toast.error('Erro ao iniciar nova conversa');
    }
  };

  const sendMessageToAI = async (userMessage: string) => {
    if (!user?.id || !currentSession) {
      console.error('❌ Usuário ou sessão não disponível');
      return;
    }

    console.log('📤 Enviando mensagem para IA:', {
      message: userMessage.substring(0, 50) + '...',
      sessionId: currentSession.id,
      agentName: agent.name
    });

    try {
      // Chamar a edge function
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          message: userMessage,
          agentPrompt: agent.prompt,
          agentName: agent.name,
          userId: user.id,
          isCustomAgent: agent.isCustom || false,
          streaming: false
        }
      });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!data?.response) {
        console.error('❌ Resposta vazia da IA');
        throw new Error('A IA retornou uma resposta vazia');
      }

      console.log('✅ Resposta da IA recebida:', {
        length: data.response.length,
        preview: data.response.substring(0, 100) + '...'
      });

      // Adicionar resposta da IA na sessão
      await addMessage(currentSession.id, 'assistant', data.response, data.tokensUsed || 0);

    } catch (error) {
      console.error('❌ Erro ao processar resposta da IA:', error);
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
    if (!message.trim() || isLoading || !currentSession) {
      console.log('⚠️ Envio bloqueado:', { 
        hasMessage: !!message.trim(), 
        isLoading, 
        hasSession: !!currentSession 
      });
      return;
    }
    
    const messageToSend = message.trim();
    setMessage('');
    setIsLoading(true);
    
    try {
      console.log('📝 Adicionando mensagem do usuário');
      // Adicionar mensagem do usuário na sessão
      await addMessage(currentSession.id, 'user', messageToSend);
      
      // Enviar para IA e aguardar resposta
      await sendMessageToAI(messageToSend);
      
      console.log('✅ Fluxo de mensagem completado com sucesso');

    } catch (error) {
      console.error('❌ Erro no fluxo de envio:', error);
      // Restaurar mensagem no campo se houver erro
      setMessage(messageToSend);
    } finally {
      setIsLoading(false);
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
                <p className="text-sm text-[#888888]">
                  {isLoading ? 'Processando...' : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportChat}
                disabled={allMessages.length === 0}
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
                  <p className="text-sm">Inicializando conversa...</p>
                </div>
              ) : allMessages.length === 0 ? (
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
          <div className="border-t border-[#4B5563]/20 p-6">
            <div className="flex space-x-3">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mensagem para ${agent.name}...`}
                className="flex-1 min-h-[44px] max-h-32 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none"
                disabled={isLoading || !currentSession}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading || !currentSession}
                size="lg"
                className={`px-6 transition-all duration-200 ${
                  isLoading 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : (message.trim() && currentSession)
                    ? 'bg-[#3B82F6] hover:bg-[#2563EB]'
                    : 'bg-gray-500'
                } text-white`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {isLoading && (
              <div className="mt-3 text-sm text-center">
                <div className="text-[#3B82F6] flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse mr-2"></div>
                  {agent.name} está pensando...
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
