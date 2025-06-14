
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Star, Zap, Crown } from 'lucide-react';

interface TokenStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenPackage {
  id: string;
  tokens: number;
  price: string;
  priceValue: number;
  popular?: boolean;
  bonus?: number;
  icon: React.ReactNode;
  description: string;
}

export const TokenStore: React.FC<TokenStoreProps> = ({ isOpen, onClose }) => {
  const packages: TokenPackage[] = [
    {
      id: 'tokens_20k',
      tokens: 20000,
      price: 'R$ 19,90',
      priceValue: 19.90,
      icon: <Coins className="w-6 h-6" />,
      description: 'Perfeito para começar'
    },
    {
      id: 'tokens_50k', 
      tokens: 50000,
      price: 'R$ 47,90',
      priceValue: 47.90,
      popular: true,
      bonus: 5000,
      icon: <Zap className="w-6 h-6" />,
      description: 'Mais vendido - Melhor custo-benefício'
    },
    {
      id: 'tokens_100k',
      tokens: 100000,
      price: 'R$ 89,90',
      priceValue: 89.90,
      bonus: 15000,
      icon: <Crown className="w-6 h-6" />,
      description: 'Máximo valor - Para usuários intensivos'
    }
  ];

  const handlePurchase = (packageId: string) => {
    // Aqui seria integrado com o sistema de pagamento (Kiwify, Stripe, etc.)
    console.log('Comprando pacote:', packageId);
    // Por enquanto apenas fecha o modal
    onClose();
  };

  const calculateTokenValue = (tokens: number, price: number) => {
    return (price / tokens * 1000).toFixed(3);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#3B82F6]" />
            Loja de Tokens
          </DialogTitle>
          <p className="text-[#CCCCCC]">
            Compre tokens extras para continuar criando copies incríveis
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative bg-[#2A2A2A] border-2 transition-all hover:scale-105 ${
                pkg.popular 
                  ? 'border-[#3B82F6] bg-[#3B82F6]/5' 
                  : 'border-[#4B5563]/30 hover:border-[#4B5563]/60'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#3B82F6] text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  pkg.popular ? 'bg-[#3B82F6]' : 'bg-[#4B5563]'
                } text-white`}>
                  {pkg.icon}
                </div>
                
                <CardTitle className="text-xl text-white">
                  {pkg.tokens.toLocaleString('pt-BR')} Tokens
                </CardTitle>
                
                {pkg.bonus && (
                  <div className="text-sm text-[#3B82F6] font-semibold">
                    + {pkg.bonus.toLocaleString('pt-BR')} Bônus
                  </div>
                )}
                
                <div className="text-3xl font-bold text-white mt-2">
                  {pkg.price}
                </div>
                
                <div className="text-sm text-[#CCCCCC]">
                  R$ {calculateTokenValue(pkg.tokens + (pkg.bonus || 0), pkg.priceValue)} por 1.000 tokens
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-center text-[#CCCCCC] text-sm">
                  {pkg.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#CCCCCC]">Tokens base:</span>
                    <span className="text-white">{pkg.tokens.toLocaleString('pt-BR')}</span>
                  </div>
                  
                  {pkg.bonus && (
                    <div className="flex justify-between">
                      <span className="text-[#CCCCCC]">Bônus:</span>
                      <span className="text-[#3B82F6]">+{pkg.bonus.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold pt-2 border-t border-[#4B5563]/30">
                    <span className="text-white">Total:</span>
                    <span className="text-white">
                      {(pkg.tokens + (pkg.bonus || 0)).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-[#3B82F6] hover:bg-[#2563EB]'
                      : 'bg-[#4B5563] hover:bg-[#374151]'
                  } text-white`}
                >
                  Comprar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-[#2A2A2A] rounded-lg border border-[#4B5563]/30">
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Como funcionam os tokens?
          </h4>
          <ul className="text-sm text-[#CCCCCC] space-y-1">
            <li>• Tokens extras são utilizados primeiro, preservando seus tokens mensais</li>
            <li>• Não expira - use quando quiser</li>
            <li>• Válido para todas as funcionalidades do Copy Chief</li>
            <li>• Processamento instantâneo após confirmação do pagamento</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
