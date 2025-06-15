
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Trash2 } from 'lucide-react';

interface FloatingChatButtonProps {
  totalUnreadCount: number;
  onOpenAgentSelection: () => void;
  onClearAllChats?: () => void;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  totalUnreadCount,
  onOpenAgentSelection,
  onClearAllChats
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end space-y-2">
        {window.location.hostname === 'localhost' && onClearAllChats && (
          <Button
            onClick={onClearAllChats}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
            title="Debug: Clear All Chats"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          onClick={onOpenAgentSelection}
          className="w-14 h-14 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
        >
          <Bot className="w-6 h-6" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
