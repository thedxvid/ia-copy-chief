
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, Package, ArrowLeft } from 'lucide-react';
import { useTokenPackages } from '@/hooks/useTokenPackages';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const TokenPurchasePage: React.FC = () => {
  const { packages, loading, purchaseTokens } = useTokenPackages();
  const navigate = useNavigate();

  const handlePurchase = async (packageId: string) => {
    try {
      await purchaseTokens(packageId);
      toast.success('Redirecionando para o checkout...', {
        description: 'Você será direcionado para completar o pagamento.'
      });
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-white">Comprar Tokens</h1>
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0 text-white hover:bg-[#2A2A2A]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-[#3B82F6]" />
              Comprar Tokens
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Tokens adicionais para continuar usando todos os recursos
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border rounded-lg p-4 bg-[#0A0A0A] border-[#2A2A2A] relative"
            >
              {pkg.tokens_amount === 1000000 && (
                <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                  Mais Popular
                </Badge>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#3B82F6]" />
                  <h3 className="font-semibold text-lg text-white">{pkg.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#3B82F6]">
                    {formatPrice(pkg.price_brl)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
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
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white h-12"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Comprar Agora
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-950/50 border border-blue-800/50 rounded-lg p-4">
          <div className="text-sm text-blue-200">
            <strong>💡 Dica:</strong> Os tokens adicionais são somados ao seu saldo atual e nunca expiram. 
            Eles são consumidos após seus tokens mensais gratuitos.
          </div>
        </div>
      </div>
    </div>
  );
};
