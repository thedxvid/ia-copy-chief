import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useTokens } from '@/hooks/useTokens';
import { SubscriptionPlansModal } from '@/components/subscription/SubscriptionPlansModal';
import { Crown, Star, Zap, Calendar, Coins, TrendingUp } from 'lucide-react';

export const SubscriptionOverview: React.FC = () => {
  const { currentPlan, getMonthlyTokens, getPlanColor } = useSubscriptionPlans();
  const { tokens } = useTokens();
  const [showPlansModal, setShowPlansModal] = React.useState(false);

  const getPlanIcon = (planName: string | null) => {
    switch (planName) {
      case 'Start': return <Zap className="h-5 w-5" />;
      case 'Gold': return <Star className="h-5 w-5" />;
      case 'Diamond': return <Crown className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toLocaleString();
  };

  const monthlyTokens = getMonthlyTokens(currentPlan?.subscription_plan_name || null);
  const usedTokens = tokens?.total_tokens_used || 0;
  const availableTokens = tokens?.total_available || 0;
  const extraTokens = tokens?.extra_tokens || 0;
  
  const usagePercentage = monthlyTokens > 0 ? ((usedTokens / monthlyTokens) * 100) : 0;
  const remainingMonthlyTokens = Math.max(0, monthlyTokens - usedTokens);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Minha Assinatura
              </CardTitle>
              <CardDescription>
                Gerencie seu plano e acompanhe o uso
              </CardDescription>
            </div>
            
            <Button 
              onClick={() => setShowPlansModal(true)}
              variant="outline"
              size="sm"
            >
              Ver Planos
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plano Atual */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getPlanColor(currentPlan?.subscription_plan_name || '')} text-white`}>
                  {getPlanIcon(currentPlan?.subscription_plan_name)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Plano {currentPlan?.subscription_plan_name || 'Padrão'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatTokens(monthlyTokens)} tokens mensais
                  </p>
                </div>
              </div>
              
              <Badge 
                variant="secondary" 
                className={`${currentPlan?.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
              >
                {currentPlan?.subscription_status === 'active' ? 'Ativo' : 'Pendente'}
              </Badge>
            </div>

            {currentPlan?.subscription_expires_at && (
              <div className="text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 inline mr-1" />
                Renova em: {new Date(currentPlan.subscription_expires_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>

          {/* Uso de Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Tokens Mensais
              </h4>
              <span className="text-sm font-medium">
                {formatTokens(remainingMonthlyTokens)} restantes
              </span>
            </div>
            
            <div className="space-y-2">
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Usado: {formatTokens(usedTokens)}</span>
                <span>Total: {formatTokens(monthlyTokens)}</span>
              </div>
            </div>
          </div>

          {/* Tokens Extras */}
          {extraTokens > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tokens Extras
                </h4>
                <span className="text-sm font-medium text-green-600">
                  +{formatTokens(extraTokens)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tokens adicionais que nunca expiram
              </p>
            </div>
          )}

          {/* Resumo Total */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Disponível</span>
              <span className="text-xl font-bold text-primary">
                {formatTokens(availableTokens)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <SubscriptionPlansModal 
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />
    </>
  );
};