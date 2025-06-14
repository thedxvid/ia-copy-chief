
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Plus, TrendingDown } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';

interface TokenWidgetProps {
  onOpenTokenStore: () => void;
}

export const TokenWidget: React.FC<TokenWidgetProps> = ({ onOpenTokenStore }) => {
  const { tokenData, loading } = useTokens();

  if (loading) {
    return (
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-[#4B5563] rounded mb-2"></div>
            <div className="h-2 bg-[#4B5563] rounded mb-2"></div>
            <div className="h-8 bg-[#4B5563] rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenData) return null;

  const monthlyUsagePercentage = ((100000 - tokenData.monthly_tokens) / 100000) * 100;
  const totalTokens = tokenData.monthly_tokens + tokenData.extra_tokens;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-sm font-medium text-white">Tokens</span>
          </div>
          <TrendingDown className="w-4 h-4 text-[#CCCCCC]" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#CCCCCC]">Mensais</span>
            <span className="text-white font-medium">
              {tokenData.monthly_tokens.toLocaleString('pt-BR')} / 100.000
            </span>
          </div>
          
          <Progress 
            value={monthlyUsagePercentage} 
            className="h-2"
          />

          {tokenData.extra_tokens > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#CCCCCC]">Extras</span>
              <span className="text-[#3B82F6] font-medium">
                +{tokenData.extra_tokens.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm pt-1 border-t border-[#4B5563]/30">
            <span className="text-[#CCCCCC]">Total disponível</span>
            <span className="text-white font-semibold">
              {totalTokens.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        <Button
          onClick={onOpenTokenStore}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Comprar Tokens
        </Button>
      </CardContent>
    </Card>
  );
};
