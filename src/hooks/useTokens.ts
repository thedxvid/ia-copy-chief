
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TokenData {
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_used: number;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTokens = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_available_tokens', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setTokens(data[0]);
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [user?.id]);

  const refreshTokens = () => {
    fetchTokens();
  };

  const getUsagePercentage = () => {
    if (!tokens) return 0;
    const totalTokens = tokens.monthly_tokens + tokens.extra_tokens;
    if (totalTokens === 0) return 100;
    return Math.round((tokens.total_available / (totalTokens + tokens.total_used)) * 100);
  };

  const getStatusColor = () => {
    const percentage = getUsagePercentage();
    if (percentage > 50) return 'text-green-500';
    if (percentage > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return {
    tokens,
    loading,
    error,
    refreshTokens,
    getUsagePercentage,
    getStatusColor,
  };
};
