
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageComponentProps {
  message: Message;
  agentName: string;
}

export const MessageComponent: React.FC<MessageComponentProps> = ({ message, agentName }) => {
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
