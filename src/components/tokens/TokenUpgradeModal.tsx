
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useTokenPackages } from '@/hooks/useTokenPackages';
import { toast } from 'sonner';

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

  const handlePurchase = async (packageId: string) => {
    try {
      await purchaseTokens(packageId);
      toast.success('Redirecionando para o checkout...', {
        description: 'Você será direcionado para completar o pagamento.'
      });
      onClose();
    } catch (error) {
      toast.error('Erro ao iniciar compra', {
        description: 'Tente novamente em alguns instantes.'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(0)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {isOutOfTokens ? (
              <>
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="text-red-600">Seus tokens acabaram!</span>
              </>
            ) : (
              <>
                <Coins className="h-6 w-6 text-yellow-500" />
                <span className="text-yellow-600">Tokens baixos - {tokensRemaining.toLocaleString()} restantes</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mensagem principal */}
          <div className={`rounded-lg p-4 ${
            isOutOfTokens 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className={`text-sm ${
              isOutOfTokens ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {isOutOfTokens ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <strong>Você não possui mais tokens disponíveis!</strong>
                  </div>
                  <p>Para continuar usando o IA Copy Chief sem limitações, você precisa adquirir tokens adicionais.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <strong>Seus tokens estão acabando!</strong>
                  </div>
                  <p>Você tem apenas {tokensRemaining.toLocaleString()} tokens restantes. Adquira mais tokens para não interromper seu trabalho.</p>
                </div>
              )}
            </div>
          </div>

          {/* Benefícios */}
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Tokens nunca expiram</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span>Processamento imediato</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <Coins className="h-4 w-4" />
              <span>Sem limitações de uso</span>
            </div>
          </div>

          {/* Pacotes */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border rounded-lg p-4 hover:border-[#3B82F6] transition-colors relative"
                >
                  {pkg.tokens_amount === 1000000 && (
                    <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      Mais Popular
                    </Badge>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#3B82F6]" />
                      <h3 className="font-semibold">{pkg.name}</h3>
                    </div>
                    <div className="text-xl font-bold text-[#3B82F6]">
                      {formatPrice(pkg.price_brl)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-3 w-3 text-green-500" />
                      <span className="text-sm">
                        <strong>{formatTokens(pkg.tokens_amount)} tokens</strong> adicionais
                      </span>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-xs text-gray-600">{pkg.description}</p>
                    )}
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                    size="sm"
                  >
                    <CreditCard className="h-3 w-3 mr-2" />
                    Comprar Agora
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 Os tokens são somados ao seu saldo atual e nunca expiram
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
