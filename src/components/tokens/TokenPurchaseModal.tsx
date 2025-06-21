
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, Package } from 'lucide-react';
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
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
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Coins className="h-5 w-5 text-[#3B82F6]" />
            Comprar Tokens Adicionais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-gray-600 px-1">
            Compre tokens adicionais para continuar usando todos os recursos do IA Copy Chief sem limitações.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 sm:p-6 hover:border-[#3B82F6] transition-colors relative w-full mb-4 sm:mb-0"
              >
                {pkg.tokens_amount === 1000000 && (
                  <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                    Mais Popular
                  </Badge>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#3B82F6] flex-shrink-0" />
                    <h3 className="font-semibold text-base sm:text-lg">{pkg.name}</h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-[#3B82F6]">
                      {formatPrice(pkg.price_brl)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      <strong>{formatTokens(pkg.tokens_amount)} tokens</strong> adicionais
                    </span>
                  </div>
                  
                  {pkg.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{pkg.description}</p>
                  )}

                  <div className="text-xs text-gray-500">
                    Tokens nunca expiram • Processamento imediato
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white mt-4 h-11 text-base font-medium"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                  Comprar Agora
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-1 sm:mx-0">
            <div className="text-sm text-blue-800 leading-relaxed">
              <strong>💡 Dica:</strong> Os tokens adicionais são somados ao seu saldo atual e nunca expiram. 
              Eles são consumidos após seus tokens mensais gratuitos.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
