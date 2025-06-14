
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TokenData {
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_used: number;
}

export const TOKEN_ESTIMATES = {
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

export const useTokens = () => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTokenData = async () => {
    if (!user) {
      setTokenData(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_available_tokens', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Erro ao buscar dados de tokens:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setTokenData(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTokenAvailability = async (feature: string): Promise<boolean> => {
    if (!tokenData) return false;
    
    const requiredTokens = TOKEN_ESTIMATES[feature as keyof typeof TOKEN_ESTIMATES] || 2000;
    return tokenData.total_available >= requiredTokens;
  };

  useEffect(() => {
    fetchTokenData();
  }, [user]);

  return {
    tokenData,
    loading,
    fetchTokenData,
    checkTokenAvailability
  };
};
