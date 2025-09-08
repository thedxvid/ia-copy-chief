import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useToast } from '@/hooks/use-toast';
import { Crown, Star, Zap, Check } from 'lucide-react';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose
}) => {
  const { plans, currentPlan, loading, subscribeToPlan, getPlanColor } = useSubscriptionPlans();
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    try {
      await subscribeToPlan(planId);
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o checkout",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar assinatura",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(tokens % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(tokens % 1000 === 0 ? 0 : 1)}K`;
    }
    return tokens.toLocaleString();
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Start': return <Zap className="h-6 w-6" />;
      case 'Gold': return <Star className="h-6 w-6" />;
      case 'Diamond': return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanFeatures = (planName: string): string[] => {
    switch (planName) {
      case 'Start':
        return [
          '100K tokens mensais',
          'Todos os agentes de IA',
          'Geração de copies',
          'Chat ilimitado',
          'Suporte por email'
        ];
      case 'Gold':
        return [
          '250K tokens mensais',
          'Todos os agentes de IA',
          'Geração de copies',
          'Chat ilimitado',
          'Análise de performance',
          'Suporte prioritário'
        ];
      case 'Diamond':
        return [
          '1M tokens mensais',
          'Todos os agentes de IA',
          'Geração de copies',
          'Chat ilimitado',
          'Análise de performance',
          'Integração N8N',
          'Suporte VIP',
          'Acesso antecipado'
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Escolha Seu Plano Mensal
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Tokens renovados automaticamente todo mês. Cancele quando quiser.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.subscription_plan_name === plan.name;
            const features = getPlanFeatures(plan.name);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  isCurrentPlan ? 'ring-2 ring-primary shadow-lg' : ''
                } ${plan.name === 'Gold' ? 'border-yellow-500 scale-105' : ''}`}
              >
                {plan.name === 'Gold' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-900">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-r ${getPlanColor(plan.name)} flex items-center justify-center text-white mb-4`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {formatTokens(plan.tokens_amount)} tokens/mês
                  </CardDescription>
                  
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{formatPrice(plan.price_brl)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      isCurrentPlan 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : plan.name === 'Gold' 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900' 
                          : ''
                    }`}
                    variant={plan.name === 'Gold' ? 'default' : 'outline'}
                  >
                    {isCurrentPlan ? 'Plano Atual' : `Assinar ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {currentPlan?.subscription_plan_name && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-center text-sm text-muted-foreground">
              Seu plano atual: <strong>{currentPlan.subscription_plan_name}</strong>
              {currentPlan.subscription_expires_at && (
                <span> • Renova em: {new Date(currentPlan.subscription_expires_at).toLocaleDateString('pt-BR')}</span>
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};