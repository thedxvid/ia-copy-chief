import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tokens_amount: number;
  price_brl: number;
  description: string | null;
  checkout_url: string;
  is_active: boolean;
  package_type: 'subscription' | 'additional';
  is_recurring: boolean;
}

export interface UserSubscription {
  subscription_plan_id: string | null;
  subscription_plan_name: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
}

export const useSubscriptionPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('package_type', 'subscription')
        .eq('is_active', true)
        .order('price_brl', { ascending: true });

      if (error) throw error;
      
      console.log('📋 PLANOS DE ASSINATURA CARREGADOS:', data);
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (err) {
      console.error('Erro ao carregar planos de assinatura:', err);
      setError('Erro ao carregar planos de assinatura');
    }
  };

  const fetchCurrentPlan = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan_id, subscription_plan_name, subscription_status, subscription_expires_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      console.log('📋 PLANO ATUAL DO USUÁRIO:', data);
      setCurrentPlan(data);
    } catch (err) {
      console.error('Erro ao carregar plano atual:', err);
      setError('Erro ao carregar plano atual');
    }
  };

  const subscribeToPlan = async (planId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const selectedPlan = plans.find(plan => plan.id === planId);
    if (!selectedPlan) throw new Error('Plano não encontrado');

    console.log('📋 INICIANDO ASSINATURA:', {
      planId,
      planName: selectedPlan.name,
      tokensAmount: selectedPlan.tokens_amount,
      checkoutUrl: selectedPlan.checkout_url,
      userId: user.id
    });

    try {
      // Validar se a URL não é um placeholder
      if (selectedPlan.checkout_url.includes('PLACEHOLDER') || selectedPlan.checkout_url.includes('lovableproject.com')) {
        console.error('❌ URL DE CHECKOUT AINDA É UM PLACEHOLDER:', selectedPlan.checkout_url);
        throw new Error('URL de checkout não configurada corretamente');
      }
      
      // Redirecionar para o checkout
      console.log('🔗 REDIRECIONANDO PARA CHECKOUT:', {
        url: selectedPlan.checkout_url,
        planName: selectedPlan.name,
        tokens: selectedPlan.tokens_amount
      });
      
      window.open(selectedPlan.checkout_url, '_blank');

      toast({
        title: "Redirecionando para pagamento",
        description: `Você será redirecionado para assinar o plano ${selectedPlan.name}`,
      });

      // Aguardar um pouco e então verificar se houve atualização
      setTimeout(() => {
        console.log('🔄 Verificando status da assinatura...');
        fetchCurrentPlan();
      }, 3000);

    } catch (error) {
      console.error('❌ Erro na assinatura:', error);
      throw error;
    }
  };

  const getMonthlyTokens = (planName: string | null): number => {
    switch (planName) {
      case 'Start': return 100000;
      case 'Gold': return 250000;
      case 'Diamond': return 1000000;
      default: return 100000; // Padrão
    }
  };

  const getPlanColor = (planName: string): string => {
    switch (planName) {
      case 'Start': return 'from-green-500 to-green-600';
      case 'Gold': return 'from-yellow-500 to-yellow-600';
      case 'Diamond': return 'from-purple-500 to-purple-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPlans(), fetchCurrentPlan()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    plans,
    currentPlan,
    loading,
    error,
    subscribeToPlan,
    getMonthlyTokens,
    getPlanColor,
    refetch: () => Promise.all([fetchPlans(), fetchCurrentPlan()])
  };
};