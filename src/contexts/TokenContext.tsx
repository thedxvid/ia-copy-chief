
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTokens, TokenData } from '@/hooks/useTokens';

interface TokenContextType {
  tokenData: TokenData | null;
  loading: boolean;
  refreshTokens: () => void;
  checkTokenAvailability: (feature: string) => Promise<boolean>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    tokenData,
    loading,
    checkTokenAvailability,
    fetchTokenData
  } = useTokens();

  const refreshTokens = () => {
    fetchTokenData();
  };

  return (
    <TokenContext.Provider value={{
      tokenData,
      loading,
      refreshTokens,
      checkTokenAvailability
    }}>
      {children}
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
