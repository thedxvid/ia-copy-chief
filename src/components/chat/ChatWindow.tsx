
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Minus, X } from 'lucide-react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatMessage } from '@/components/agents/ChatMessage';
import { TypingIndicator } from '@/components/agents/TypingIndicator';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface ChatWindowProps {
  agent: Agent;
  onBack: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onNewMessage?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  agent,
  onBack,
  onMinimize,
  onClose,
  onNewMessage
}) => {
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    isLoading,
    sendMessage,
  } = useAgentChat(agent.id);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Trigger callback when new message arrives
  useEffect(() => {
    if (messages.length > 0 && onNewMessage) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        onNewMessage();
      }
    }
  }, [messages, onNewMessage]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    await sendMessage(message, agent.prompt, agent.name, agent.isCustom);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#4B5563]/20 rounded-lg shadow-xl w-80 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#4B5563]/20 bg-[#252525] rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-[#CCCCCC] hover:text-white w-6 h-6"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
          }`}>
            <agent.icon className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{agent.name}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="text-[#CCCCCC] hover:text-white w-6 h-6"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#CCCCCC] hover:text-white w-6 h-6"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3" ref={scrollAreaRef}>
        <div className="space-y-3 py-3">
          {messages.length === 0 ? (
            <div className="text-center text-[#888888] py-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
              }`}>
                <agent.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-medium text-white">{agent.name}</p>
              <p className="text-xs text-[#CCCCCC] mt-1">{agent.description}</p>
              <p className="text-xs mt-2">Como posso ajudar?</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))
          )}
          {isLoading && <TypingIndicator agentName={agent.name} />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#4B5563]/20">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Mensagem para ${agent.name}...`}
            className="flex-1 min-h-[36px] max-h-20 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            size="icon"
            className="h-[36px] w-[36px] bg-[#3B82F6] hover:bg-[#2563EB] text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
