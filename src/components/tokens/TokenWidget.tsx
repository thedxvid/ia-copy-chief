
import React, { useEffect } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, Percent, RefreshCw, AlertTriangle } from 'lucide-react';

export const TokenWidget = () => {
  const { 
    tokens, 
    loading, 
    error, 
    getUsagePercentage, 
    getStatusColor, 
    getStatusMessage,
    shouldShowLowTokenWarning,
    getRemainingDaysEstimate,
    refreshTokens 
  } = useTokens();

  // Auto-refresh tokens a cada 30 segundos quando há atividade
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTokens();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshTokens]);

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] cursor-pointer"
                 onClick={refreshTokens}>
              <Coins className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">Erro</span>
              <RefreshCw className="h-3 w-3 text-gray-400 hover:text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Erro ao carregar tokens. Clique para tentar novamente.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const percentage = getUsagePercentage();
  const isLowTokens = shouldShowLowTokenWarning();
  const remainingDays = getRemainingDaysEstimate();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Desktop Version */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] hover:border-[#3B82F6]/50 transition-colors cursor-pointer"
                 onClick={refreshTokens}>
              <Coins className={`h-4 w-4 ${isLowTokens ? 'text-red-500' : 'text-[#3B82F6]'}`} />
              
              {isLowTokens && <AlertTriangle className="h-3 w-3 text-red-500" />}
              
              <span className={`text-xs font-medium ${isLowTokens ? 'text-red-400' : 'text-white'}`}>
                {formatNumber(tokens.total_available)} / {formatNumber(tokens.monthly_tokens + tokens.extra_tokens)}
              </span>
              
              <div className="w-8 h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    percentage > 50 ? 'bg-green-500' : 
                    percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <RefreshCw className="h-3 w-3 text-gray-400 hover:text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p><strong>Status:</strong> {getStatusMessage()}</p>
              <p><strong>Disponível:</strong> {tokens.total_available.toLocaleString()} tokens</p>
              <p><strong>Usados:</strong> {tokens.total_used.toLocaleString()} tokens</p>
              {remainingDays !== null && (
                <p><strong>Duração estimada:</strong> ~{remainingDays} dias</p>
              )}
              <p className="text-xs text-gray-400">Clique para atualizar</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Mobile Version */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] cursor-pointer"
                 onClick={refreshTokens}>
              <Coins className={`h-3.5 w-3.5 ${isLowTokens ? 'text-red-500' : 'text-[#3B82F6]'}`} />
              
              {isLowTokens && <AlertTriangle className="h-3 w-3 text-red-500" />}
              
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {percentage}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p><strong>{getStatusMessage()}</strong></p>
              <p>{formatNumber(tokens.total_available)} / {formatNumber(tokens.monthly_tokens + tokens.extra_tokens)} tokens</p>
              {isLowTokens && <p className="text-red-400">⚠️ Tokens baixos!</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Buy Tokens Button (Desktop only, for future implementation) */}
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden lg:flex items-center gap-1 h-8 px-2 text-xs border-[#2A2A2A] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white"
          disabled
        >
          <Percent className="h-3 w-3" />
          Comprar
        </Button>

        {/* Low Token Warning for Mobile */}
        {isLowTokens && (
          <div className="md:hidden">
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
