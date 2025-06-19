
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Coins, TrendingDown, TrendingUp, Zap } from 'lucide-react';

interface TokenFeedbackProps {
  tokensUsed?: number;
  feature?: string;
  show?: boolean;
  onComplete?: () => void;
}

export const TokenFeedback: React.FC<TokenFeedbackProps> = ({
  tokensUsed,
  feature = 'chat',
  show = false,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show && tokensUsed && tokensUsed > 0) {
      setIsVisible(true);
      
      // Escolher ícone e cor baseado no uso
      const getIcon = () => {
        if (tokensUsed > 2000) return '🔥';
        if (tokensUsed > 1000) return '⚡';
        return '✨';
      };

      const getColor = () => {
        if (tokensUsed > 2000) return 'text-red-500';
        if (tokensUsed > 1000) return 'text-yellow-500';
        return 'text-green-500';
      };

      // Toast personalizado com animação
      toast.success(`${getIcon()} Tokens Consumidos`, {
        description: (
          <div className="flex items-center gap-2 text-sm">
            <Coins className={`h-4 w-4 ${getColor()}`} />
            <span>
              <strong>{tokensUsed.toLocaleString()}</strong> tokens usados
            </span>
            <span className="text-gray-400">• {feature}</span>
          </div>
        ),
        duration: 3000,
        className: 'bg-[#1E1E1E] border-[#2A2A2A] text-white',
      });

      // Auto-hide após alguns segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [show, tokensUsed, feature, onComplete]);

  return null; // O feedback é mostrado via toast
};

// Hook para usar o feedback facilmente
export const useTokenFeedback = () => {
  const [feedback, setFeedback] = useState<{
    show: boolean;
    tokensUsed?: number;
    feature?: string;
  }>({ show: false });

  const showFeedback = (tokensUsed: number, feature: string = 'ação') => {
    setFeedback({ show: true, tokensUsed, feature });
  };

  const hideFeedback = () => {
    setFeedback({ show: false });
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
    TokenFeedback: () => (
      <TokenFeedback
        {...feedback}
        onComplete={hideFeedback}
      />
    )
  };
};
