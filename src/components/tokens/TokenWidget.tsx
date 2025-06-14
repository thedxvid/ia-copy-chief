
import React from 'react';
import { useTokens } from '@/hooks/useTokens';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { coins, percent } from 'lucide-react';

export const TokenWidget = () => {
  const { tokens, loading, error, getUsagePercentage, getStatusColor } = useTokens();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A]">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (error || !tokens) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A]">
        <coins className="h-4 w-4 text-red-500" />
        <span className="text-xs text-red-500">Erro</span>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Desktop Version */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] hover:border-[#3B82F6]/50 transition-colors">
        <coins className="h-4 w-4 text-[#3B82F6]" />
        <span className="text-xs text-white font-medium">
          {formatNumber(tokens.total_available)} / {formatNumber(tokens.monthly_tokens + tokens.extra_tokens)}
        </span>
        <div className="w-2 h-2 rounded-full bg-[#2A2A2A]">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              getUsagePercentage() > 50 ? 'bg-green-500' : 
              getUsagePercentage() > 20 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${getUsagePercentage()}%` }}
          />
        </div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A]">
        <coins className="h-3.5 w-3.5 text-[#3B82F6]" />
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getUsagePercentage()}%
        </span>
      </div>

      {/* Buy Tokens Button (Desktop only, for future implementation) */}
      <Button 
        variant="outline" 
        size="sm" 
        className="hidden lg:flex items-center gap-1 h-8 px-2 text-xs border-[#2A2A2A] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white"
        disabled
      >
        <percent className="h-3 w-3" />
        Comprar
      </Button>
    </div>
  );
};
