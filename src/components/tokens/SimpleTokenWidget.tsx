
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';

export const SimpleTokenWidget: React.FC = () => {
  const { tokenData, loading } = useTokens();

  if (loading) {
    return (
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardContent className="p-3">
          <div className="animate-pulse">
            <div className="h-3 bg-[#4B5563] rounded mb-2"></div>
            <div className="h-2 bg-[#4B5563] rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenData) return null;

  const totalTokens = tokenData.monthly_tokens + tokenData.extra_tokens;

  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-colors">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#3B82F6]" />
          <span className="text-sm font-medium text-white">Tokens</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#CCCCCC]">Disponível</span>
            <span className="text-white font-medium">
              {totalTokens.toLocaleString('pt-BR')}
            </span>
          </div>
          
          {tokenData.extra_tokens > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#CCCCCC]">Extras</span>
              <span className="text-[#3B82F6] font-medium">
                +{tokenData.extra_tokens.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
