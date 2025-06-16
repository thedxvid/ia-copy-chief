
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, Trash2 } from 'lucide-react';
import { useStreamingChat } from '@/hooks/useStreamingChat';
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
    messages,
    isConnected,
    isTyping,
    isSending,
    connectionStatus,
    sendMessage,
    clearChat,
    reconnect
  } = useStreamingChat(agent.id);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Focus automático no textarea quando o modal abre
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isSending || isTyping) return;
    
    const messageToSend = message;
    setMessage(''); // Limpar input imediatamente
    
    try {
      await sendMessage(messageToSend, agent.prompt, agent.name, agent.isCustom);
    } catch (error) {
      // Em caso de erro, restaurar a mensagem
      setMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportChat = () => {
    if (messages.length === 0) return;

    const chatContent = messages.map(msg => {
      const time = (msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)).toLocaleTimeString('pt-BR', { 
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
    a.download = `chat-${agent.name}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563]/20 text-white max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader className="border-b border-[#4B5563]/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
              }`}>
                <agent.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">
                  {agent.name}
                </DialogTitle>
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
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0}
                className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Área de mensagens */}
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
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
              messages.map((msg, index) => (
                <StreamingMessage 
                  key={msg.id} 
                  message={msg} 
                  isLast={index === messages.length - 1}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Área de input */}
        <div className="border-t border-[#4B5563]/20 p-6">
          <div className="flex space-x-3">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mensagem para ${agent.name}...`}
              className="flex-1 min-h-[44px] max-h-32 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none"
              disabled={isSending || isTyping || !isConnected}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending || isTyping || !isConnected}
              size="lg"
              className={`px-6 ${
                isSending 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-[#3B82F6] hover:bg-[#2563EB]'
              } text-white transition-all duration-200`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isSending && (
            <div className="mt-3 text-sm text-[#3B82F6] flex items-center">
              <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse mr-2"></div>
              Enviando mensagem...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
