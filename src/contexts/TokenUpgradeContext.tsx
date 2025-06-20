
import React, { createContext, useContext, ReactNode } from 'react';
import { TokenUpgradeModal } from '@/components/tokens/TokenUpgradeModal';
import { useTokensOptimized } from '@/hooks/useTokensOptimized';
import { useAuth } from '@/contexts/AuthContext';

interface TokenUpgradeContextType {
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  tokens: any;
}

const TokenUpgradeContext = createContext<TokenUpgradeContextType | undefined>(undefined);

export const useTokenUpgrade = () => {
  const context = useContext(TokenUpgradeContext);
  if (context === undefined) {
    throw new Error('useTokenUpgrade must be used within a TokenUpgradeProvider');
  }
  return context;
};

interface TokenUpgradeProviderProps {
  children: ReactNode;
}

export const TokenUpgradeProvider: React.FC<TokenUpgradeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { tokens, showUpgradeModal, setShowUpgradeModal } = useTokensOptimized();

  // Só renderizar se o usuário estiver logado
  if (!user) {
    return <>{children}</>;
  }

  return (
    <TokenUpgradeContext.Provider value={{ showUpgradeModal, setShowUpgradeModal, tokens }}>
      {children}
      
      {/* Modal global de upgrade de tokens */}
      <TokenUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tokensRemaining={tokens?.total_available || 0}
        isOutOfTokens={tokens?.total_available === 0}
      />
    </TokenUpgradeContext.Provider>
  );
};
