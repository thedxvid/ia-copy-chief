
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, Package, ArrowLeft, X } from 'lucide-react';
import { useTokenPackages, TokenPackage } from '@/hooks/useTokenPackages';
import { toast } from 'sonner';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute -top-2 -right-2 h-8 w-8 p-0 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Coins className="h-5 w-5 text-[#3B82F6]" />
              Comprar Tokens Adicionais
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -top-2 -right-2 h-8 w-8 p-0 md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8 md:pr-0">
            <Coins className="h-5 w-5 text-[#3B82F6]" />
            Comprar Tokens Adicionais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <div className="text-sm text-gray-600">
            Compre tokens adicionais para continuar usando todos os recursos do IA Copy Chief sem limitações.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 sm:p-6 hover:border-[#3B82F6] transition-colors relative bg-[#0A0A0A] border-[#2A2A2A]"
              >
                {pkg.tokens_amount === 1000000 && (
                  <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                    Mais Popular
                  </Badge>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B82F6]" />
                    <h3 className="font-semibold text-base sm:text-lg text-white">{pkg.name}</h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-[#3B82F6]">
                      {formatPrice(pkg.price_brl)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-white">
                      <strong>{formatTokens(pkg.tokens_amount)} tokens</strong> adicionais
                    </span>
                  </div>
                  
                  {pkg.description && (
                    <p className="text-sm text-gray-400">{pkg.description}</p>
                  )}

                  <div className="text-xs text-gray-500">
                    Tokens nunca expiram • Processamento imediato
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white h-10 sm:h-12"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Comprar Agora
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-blue-950/50 border border-blue-800/50 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-blue-200">
              <strong>💡 Dica:</strong> Os tokens adicionais são somados ao seu saldo atual e nunca expiram. 
              Eles são consumidos após seus tokens mensais gratuitos.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
