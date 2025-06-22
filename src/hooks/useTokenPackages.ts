
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';

export interface TokenPackage {
  id: string;
  name: string;
  tokens_amount: number;
  price_brl: number;
  description: string | null;
  checkout_url: string;
  is_active: boolean;
}

export const useTokenPackages = () => {
  const { user } = useAuth();
  const { setTokenProcessing, refreshTokens } = useTokens();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('is_active', true)
        .order('tokens_amount', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
      setError('Erro ao carregar pacotes de tokens');
    } finally {
      setLoading(false);
    }
  };

  const purchaseTokens = async (packageId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (!selectedPackage) throw new Error('Pacote não encontrado');

    console.log('🛒 INICIANDO COMPRA DE TOKENS:', {
      packageId,
      packageName: selectedPackage.name,
      tokensAmount: selectedPackage.tokens_amount,
      checkoutUrl: selectedPackage.checkout_url,
      userId: user.id
    });

    // Marcar como processando
    setTokenProcessing(`Processando compra de ${selectedPackage.tokens_amount.toLocaleString()} tokens...`);

    try {
      // Registrar a compra no banco
      const { data: purchase, error: purchaseError } = await supabase
        .from('token_package_purchases')
        .insert({
          user_id: user.id,
          package_id: packageId,
          tokens_purchased: selectedPackage.tokens_amount,
          amount_paid: selectedPackage.price_brl,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('❌ Erro ao registrar compra:', purchaseError);
        throw purchaseError;
      }

      console.log('✅ Compra registrada:', purchase);

      // Redirecionar para o checkout usando a URL específica do pacote
      console.log('🔗 Redirecionando para checkout:', selectedPackage.checkout_url);
      window.open(selectedPackage.checkout_url, '_blank');

      // Aguardar um pouco e então verificar se houve atualização
      setTimeout(() => {
        console.log('🔄 Verificando status da compra...');
        refreshTokens(true);
      }, 3000);

      // Continuar verificando por 30 segundos
      const checkInterval = setInterval(async () => {
        const { data: updatedPurchase } = await supabase
          .from('token_package_purchases')
          .select('payment_status')
          .eq('id', purchase.id)
          .single();

        if (updatedPurchase?.payment_status === 'completed') {
          console.log('✅ COMPRA COMPLETADA - atualizando tokens...');
          clearInterval(checkInterval);
          refreshTokens(true);
        }
      }, 5000);

      // Limpar intervalo após 30 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 30000);

    } catch (error) {
      console.error('❌ Erro na compra:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    purchaseTokens,
    refetch: fetchPackages
  };
};
