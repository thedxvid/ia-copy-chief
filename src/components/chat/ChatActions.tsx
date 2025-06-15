
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2 } from 'lucide-react';

interface ChatActionsProps {
  onOpenAgentSelection: () => void;
  onClearAllChats?: () => void;
}

export const ChatActions: React.FC<ChatActionsProps> = ({
  onOpenAgentSelection,
  onClearAllChats
}) => {
  return (
    <div className="flex justify-end space-x-2">
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
        className="w-12 h-12 rounded-full bg-[#10B981] hover:bg-[#059669] text-white shadow-lg hover:shadow-xl transition-all duration-200"
        title="Abrir novo chat"
      >
        <MessageSquare className="w-5 h-5" />
      </Button>
    </div>
  );
};
