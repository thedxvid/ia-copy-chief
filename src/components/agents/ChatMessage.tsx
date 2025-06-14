
import React from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date | string;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: Date | string) => {
    // Garantir que timestamp seja sempre um objeto Date
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Agora';
    }
    
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-[#3B82F6] text-white ml-auto' 
            : 'bg-[#2A2A2A] text-white border border-[#4B5563]/20'
        }`}>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
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
              className="h-auto p-1 text-[#888888] hover:text-white"
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
