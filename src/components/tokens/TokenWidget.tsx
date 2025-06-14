
import React, { useEffect } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, RefreshCw, AlertTriangle, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

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
    refreshTokens,
    getMonthlyLimit
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
  const monthlyLimit = getMonthlyLimit();
  const usagePercentage = 100 - percentage;

  // Determinar cor e ícone baseado no status
  const getStatusIcon = () => {
    if (usagePercentage >= 90) return <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />;
    if (usagePercentage >= 50) return <TrendingDown className="h-3 w-3 text-yellow-500" />;
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  };

  const getProgressBarColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Desktop Version */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] hover:border-[#3B82F6]/50 transition-colors cursor-pointer"
                 onClick={refreshTokens}>
              <Coins className={`h-4 w-4 ${isLowTokens ? 'text-red-500' : 'text-[#3B82F6]'}`} />
              
              {getStatusIcon()}
              
              <span className={`text-xs font-medium ${isLowTokens ? 'text-red-400' : 'text-white'}`}>
                {formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)}
              </span>
              
              {/* Barra de progresso com animação */}
              <div className="w-12 h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Indicador de dias restantes */}
              {remainingDays !== null && remainingDays < 7 && (
                <span className="text-xs text-orange-400 font-medium">
                  ~{remainingDays}d
                </span>
              )}
              
              <RefreshCw className="h-3 w-3 text-gray-400 hover:text-white transition-colors" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <strong>Status:</strong> 
                <span className={getStatusColor()}>{getStatusMessage()}</span>
              </div>
              <div className="space-y-1 text-xs">
                <p><strong>Disponível:</strong> {tokens.total_available.toLocaleString()} tokens</p>
                <p><strong>Usados:</strong> {(monthlyLimit - tokens.total_available).toLocaleString()} tokens ({usagePercentage.toFixed(1)}%)</p>
                <p><strong>Limite mensal:</strong> {monthlyLimit.toLocaleString()} tokens</p>
                {remainingDays !== null && (
                  <p><strong>Duração estimada:</strong> ~{remainingDays} dias</p>
                )}
                {isLowTokens && (
                  <p className="text-red-400 font-medium">⚠️ Tokens baixos! Considere economizar.</p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">💡 Clique para atualizar</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Mobile Version */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] cursor-pointer"
                 onClick={refreshTokens}>
              <Coins className={`h-3.5 w-3.5 ${isLowTokens ? 'text-red-500' : 'text-[#3B82F6]'}`} />
              
              {getStatusIcon()}
              
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {formatNumber(tokens.total_available)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p><strong>{getStatusMessage()}</strong></p>
              <p>{formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)} tokens</p>
              <p>Usado: {usagePercentage.toFixed(1)}%</p>
              {isLowTokens && <p className="text-red-400">⚠️ Tokens baixos!</p>}
              {remainingDays !== null && remainingDays < 7 && (
                <p className="text-orange-400">~{remainingDays} dias restantes</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Botão de Compra - Preparado para futuro */}
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden lg:flex items-center gap-1 h-8 px-2 text-xs border-[#2A2A2A] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white transition-colors"
          disabled
        >
          <DollarSign className="h-3 w-3" />
          Comprar
        </Button>

        {/* Alerta móvel para tokens baixos */}
        {isLowTokens && (
          <div className="md:hidden">
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
