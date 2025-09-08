import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTokenPackages } from '@/hooks/useTokenPackages';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useToast } from '@/hooks/use-toast';
import { Zap, Target, TrendingUp, Star, Crown, Calendar, Package, CreditCard } from 'lucide-react';
import { SubscriptionPlansModal } from '@/components/subscription/SubscriptionPlansModal';

interface TokenUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokensRemaining: number;
  isOutOfTokens: boolean;
}

export const TokenUpgradeModal: React.FC<TokenUpgradeModalProps> = ({
  isOpen,
  onClose,
  tokensRemaining,
  isOutOfTokens
}) => {
  const { packages, loading, purchaseTokens } = useTokenPackages();
  const { currentPlan } = useSubscriptionPlans();
  const { toast } = useToast();
  const [showSubscriptionPlans, setShowSubscriptionPlans] = React.useState(false);

  const handlePurchase = async (packageId: string) => {
    try {
      await purchaseTokens(packageId);
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o checkout",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar compra",
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
            {isOutOfTokens ? "Seus tokens acabaram!" : "Poucos tokens restantes"}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {isOutOfTokens 
              ? "Você precisa de mais tokens para continuar usando nossa IA."
              : `Você tem apenas ${tokensRemaining.toLocaleString()} tokens restantes.`
            }
          </DialogDescription>
          
          {currentPlan?.subscription_plan_name && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-center text-sm">
                <Calendar className="h-4 w-4 inline mr-1" />
                Plano atual: <strong>{currentPlan.subscription_plan_name}</strong>
                {currentPlan.subscription_expires_at && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Tokens renovam em: {new Date(currentPlan.subscription_expires_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Planos Mensais */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Planos de Assinatura Mensal</h3>
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                Recomendado
              </Badge>
            </div>
            
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-dashed border-blue-300 dark:border-blue-700">
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-4">
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-medium">Start</p>
                    <p className="text-xs text-muted-foreground">100K/mês</p>
                    <p className="text-sm font-bold">R$ 97</p>
                  </div>
                  <div className="text-center">
                    <Star className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                    <p className="text-sm font-medium">Gold</p>
                    <p className="text-xs text-muted-foreground">250K/mês</p>
                    <p className="text-sm font-bold">R$ 197</p>
                  </div>
                  <div className="text-center">
                    <Crown className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-sm font-medium">Diamond</p>
                    <p className="text-xs text-muted-foreground">1M/mês</p>
                    <p className="text-sm font-bold">R$ 397</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowSubscriptionPlans(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Ver Planos de Assinatura
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  💡 Tokens renovados automaticamente todo mês
                </p>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Seção de Tokens Extras */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tokens Extras (Compra Avulsa)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compre tokens extras para usar além da sua cota mensal
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Zap className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium">Geração Ilimitada</p>
                <p className="text-xs text-muted-foreground">Crie quantos copies precisar</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Target className="h-6 w-6 mx-auto text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium">Precisão Premium</p>
                <p className="text-xs text-muted-foreground">IA mais inteligente e assertiva</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium">Resultados Rápidos</p>
                <p className="text-xs text-muted-foreground">Respostas em segundos</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <Star className="h-6 w-6 mx-auto text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium">Acesso Completo</p>
                <p className="text-xs text-muted-foreground">Todas as funcionalidades</p>
              </div>
            </div>
          </div>

          {/* Pacotes de Tokens Extras */}
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="relative hover:shadow-lg transition-all duration-300">
                  {pkg.tokens_amount === 1000000 && (
                    <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      Mais Popular
                    </Badge>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {formatPrice(pkg.price_brl)}
                      </div>
                    </div>
                    <CardDescription>
                      {formatTokens(pkg.tokens_amount)} tokens extras
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    )}

                    <Button
                      onClick={() => handlePurchase(pkg.id)}
                      className="w-full"
                      variant="outline"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Comprar Tokens
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pacote de tokens disponível no momento.</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 Os tokens extras são somados ao seu saldo atual e nunca expiram
            </p>
          </div>
        </div>
        
        <SubscriptionPlansModal 
          isOpen={showSubscriptionPlans}
          onClose={() => setShowSubscriptionPlans(false)}
        />
      </DialogContent>
    </Dialog>
  );
};