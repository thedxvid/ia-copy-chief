
import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading && !disabled) {
      console.log('🎯 ChatInput: Enviando mensagem');
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🎯 ChatInput: Enter pressionado');
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#4B5563] p-4 bg-[#1E1E1E]">
      <div className="flex space-x-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Selecione um agente para começar..." : "Digite sua mensagem..."}
          className="flex-1 bg-[#2A2A2A] border-[#4B5563] text-white resize-none"
          rows={3}
          disabled={disabled || isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || disabled}
          className="bg-[#3B82F6] hover:bg-[#2563EB] h-auto px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
