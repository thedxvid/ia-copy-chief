import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TokenPackage {
  id: string;
  name: string;
  tokens_amount: number;
  price_brl: number;
  checkout_url: string;
  description: string | null;
  is_active: boolean;
}

export interface TokenPurchase {
  id: string;
  package_id: string;
  tokens_purchased: number;
  amount_paid: number;
  payment_status: string;
  digital_guru_order_id: string | null;
  processed_at: string | null;
  created_at: string;
  package?: TokenPackage;
}

export const useTokenPackages = () => {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('is_active', true)
        .order('tokens_amount', { ascending: true });

      if (error) throw error;

      // Atualizar links de checkout se necessário
      const packagesWithUpdatedLinks = data?.map(pkg => {
        const checkoutUrls: { [key: number]: string } = {
          100000: 'https://clkdmg.site/pay/100-mil-tokens',
          250000: 'https://clkdmg.site/pay/250-mil-tokens', 
          500000: 'https://clkdmg.site/pay/500-mil-tokens',
          1000000: 'https://clkdmg.site/pay/1-milhao-de-tokens'
        };
        
        return {
          ...pkg,
          checkout_url: checkoutUrls[pkg.tokens_amount] || pkg.checkout_url
        };
      }) || [];

      setPackages(packagesWithUpdatedLinks);
    } catch (err) {
      console.error('Erro ao buscar pacotes de tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacotes');
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('token_package_purchases')
        .select(`
          *,
          token_packages (
            id,
            name,
            tokens_amount,
            price_brl,
            description,
            checkout_url,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const purchasesWithPackages = data?.map(purchase => ({
        ...purchase,
        package: purchase.token_packages as TokenPackage
      })) || [];

      setPurchases(purchasesWithPackages);
    } catch (err) {
      console.error('Erro ao buscar histórico de compras:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar compras');
    }
  };

  const purchaseTokens = async (packageId: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const selectedPackage = packages.find(p => p.id === packageId);
      if (!selectedPackage) {
        throw new Error('Pacote não encontrado');
      }

      // Redirecionar para o checkout
      window.open(selectedPackage.checkout_url, '_blank');

      // Registrar intenção de compra no banco
      const { error } = await supabase
        .from('token_package_purchases')
        .insert({
          user_id: user.id,
          package_id: packageId,
          tokens_purchased: selectedPackage.tokens_amount,
          amount_paid: selectedPackage.price_brl,
          payment_status: 'pending'
        });

      if (error) {
        console.warn('Erro ao registrar intenção de compra:', error);
      }

      return true;
    } catch (err) {
      console.error('Erro ao iniciar compra:', err);
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPackages(), fetchPurchases()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    packages,
    purchases,
    loading,
    error,
    purchaseTokens,
    refreshPackages: fetchPackages,
    refreshPurchases: fetchPurchases
  };
};
