
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTokens, TokenData } from '@/hooks/useTokens';
import { TokenInsufficientModal } from '@/components/tokens/TokenInsufficientModal';
import { TokenStore } from '@/components/tokens/TokenStore';

interface TokenContextType {
  tokenData: TokenData | null;
  loading: boolean;
  checkAndConsumeTokens: (feature: string) => Promise<boolean>;
  showInsufficientTokensModal: (feature: string, requiredTokens: number, availableTokens: number) => void;
  openTokenStore: () => void;
  refreshTokens: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    tokenData,
    loading,
    checkTokenAvailability,
    consumeTokens,
    fetchTokenData
  } = useTokens();

  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [tokenStoreOpen, setTokenStoreOpen] = useState(false);
  const [modalData, setModalData] = useState({
    feature: '',
    requiredTokens: 0,
    availableTokens: 0
  });

  const checkAndConsumeTokens = async (feature: string): Promise<boolean> => {
    const hasTokens = await checkTokenAvailability(feature);
    
    if (!hasTokens && tokenData) {
      const requiredTokens = TOKEN_ESTIMATES[feature as keyof typeof TOKEN_ESTIMATES] || 2000;
      showInsufficientTokensModal(feature, requiredTokens, tokenData.total_available);
      return false;
    }

    return true;
  };

  const showInsufficientTokensModal = (feature: string, requiredTokens: number, availableTokens: number) => {
    setModalData({ feature, requiredTokens, availableTokens });
    setInsufficientModalOpen(true);
  };

  const openTokenStore = () => {
    setTokenStoreOpen(true);
  };

  const refreshTokens = () => {
    fetchTokenData();
  };

  return (
    <TokenContext.Provider value={{
      tokenData,
      loading,
      checkAndConsumeTokens,
      showInsufficientTokensModal,
      openTokenStore,
      refreshTokens
    }}>
      {children}
      
      <TokenInsufficientModal
        isOpen={insufficientModalOpen}
        onClose={() => setInsufficientModalOpen(false)}
        onOpenTokenStore={openTokenStore}
        requiredTokens={modalData.requiredTokens}
        availableTokens={modalData.availableTokens}
        feature={modalData.feature}
      />

      <TokenStore
        isOpen={tokenStoreOpen}
        onClose={() => setTokenStoreOpen(false)}
      />
    </TokenContext.Provider>
  );
};

export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }
  return context;
};

// Importar aqui para evitar dependência circular
const TOKEN_ESTIMATES = {
  'generate_copy_short': 2000,
  'generate_copy_long': 8000,
  'optimize_copy': 3000,
  'brainstorm_ideas': 1500,
  'generate_headlines': 1200,
  'rewrite_copy': 2500,
  'analyze_competitor': 4000,
  'chat_message': 1000,
  'custom_agent': 2000
};
