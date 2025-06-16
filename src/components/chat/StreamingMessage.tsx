
import React, { useEffect, useRef } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date | string;
  isStreaming?: boolean;
}

interface StreamingMessageProps {
  message: Message;
  isLast?: boolean;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ message, isLast = false }) => {
  const [copied, setCopied] = useState(false);
  const [displayContent, setDisplayContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';

  // Efeito de typing progressivo para mensagens em streaming
  useEffect(() => {
    if (message.isStreaming && message.content) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < message.content.length) {
          setDisplayContent(message.content.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 20); // 50 caracteres por segundo para efeito natural

      return () => clearInterval(interval);
    } else {
      setDisplayContent(message.content);
    }
  }, [message.content, message.isStreaming]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (isLast && contentRef.current) {
      contentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [displayContent, isLast]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return 'Agora';
    }
    
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      ref={contentRef}
      className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
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
            {displayContent}
            {message.isStreaming && (
              <span className="inline-block w-2 h-5 bg-[#3B82F6] ml-1 animate-pulse rounded-sm"></span>
            )}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-[#888888] ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {!isUser && !message.isStreaming && (
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
