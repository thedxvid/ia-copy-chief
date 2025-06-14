
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, Trash2, Bot, User } from 'lucide-react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

interface AgentChatModalProps {
  agent: any;
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
    isLoading,
    sendMessage,
    clearChat,
    exportChat
  } = useAgentChat(agent?.id);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    await sendMessage(message, agent?.prompt, agent?.name);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = () => {
    exportChat(agent?.name || 'Agente');
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-[#1E1E1E] border-[#4B5563]/20 text-white flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-[#4B5563]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                <agent.icon className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl text-white">
                {agent.name}
              </DialogTitle>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                disabled={messages.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                disabled={messages.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-1" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-[#888888] py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-[#4B5563]" />
                  <p className="text-lg mb-2">Olá! Sou o {agent.name}</p>
                  <p className="text-sm">{agent.description}</p>
                  <p className="text-xs mt-4">Como posso ajudar você hoje?</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))
              )}
              {isLoading && <TypingIndicator agentName={agent.name} />}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 border-t border-[#4B5563]/20 pt-4">
            <div className="flex space-x-3">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mensagem para ${agent.name}...`}
                className="flex-1 min-h-[44px] max-h-32 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="h-[44px] px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-[#888888]">
              <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
              <span>{message.length}/4000</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
