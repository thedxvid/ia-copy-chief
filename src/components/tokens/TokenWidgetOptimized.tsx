
import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Coins, 
  RefreshCw, 
  AlertTriangle, 
  Plus
} from 'lucide-react';
import { useTokensOptimized } from '@/hooks/useTokensOptimized';

export const TokenWidgetOptimized = memo(() => {
  const { 
    tokens, 
    loading, 
    error, 
    isRefreshing,
    refreshTokens,
    getUsagePercentage,
    getStatusColor,
    shouldShowLowTokenWarning
  } = useTokensOptimized();

  const handleRefreshClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    refreshTokens();
  };

  if (loading && !tokens) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A]">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (error && !tokens) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-red-500/50">
              <Coins className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">Erro</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Erro ao carregar tokens. Clique para tentar novamente.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!tokens) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const usagePercentage = getUsagePercentage();
  const remainingPercentage = 100 - usagePercentage;
  const isLowTokens = shouldShowLowTokenWarning();
  const isCritical = tokens.total_available === 0;
  const statusColor = getStatusColor();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Desktop Version */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] hover:border-[#3B82F6]/50 transition-all cursor-pointer">
              <div className="relative">
                <Coins className={`h-4 w-4 transition-colors ${statusColor}`} />
                {isCritical && (
                  <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse absolute -top-1 -right-1" />
                )}
              </div>
              
              <span className={`text-xs font-medium transition-colors ${
                isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
              }`}>
                {formatNumber(tokens.total_available)}
              </span>
              
              {/* Barra de progresso simplificada */}
              <div className="w-12 h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingPercentage > 50 ? 'bg-green-500' :
                    remainingPercentage > 20 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(5, remainingPercentage)}%` }}
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="h-5 w-5 p-0 text-gray-400 hover:text-[#3B82F6]"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p><strong>{tokens.total_available.toLocaleString()}</strong> tokens disponíveis</p>
              <p>Usado: {usagePercentage.toFixed(1)}%</p>
              {isCritical && <p className="text-red-400">⚠️ Tokens esgotados!</p>}
              {isLowTokens && !isCritical && <p className="text-yellow-400">⚠️ Tokens baixos!</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Mobile Version - Mais compacto */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A]">
              <Coins className={`h-3.5 w-3.5 ${statusColor}`} />
              <span className={`text-xs font-medium ${statusColor}`}>
                {formatNumber(tokens.total_available)}
              </span>
              {isCritical && <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>{formatNumber(tokens.total_available)} tokens</p>
              {isCritical && <p className="text-red-400">Tokens esgotados!</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Botão de Compra - apenas desktop */}
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden lg:flex items-center gap-1 h-8 px-2 text-xs border-[#2A2A2A] text-[#CCCCCC] hover:bg-[#2A2A2A]"
        >
          <Plus className="h-3 w-3" />
          Tokens
        </Button>
      </div>
    </TooltipProvider>
  );
});

TokenWidgetOptimized.displayName = 'TokenWidgetOptimized';
