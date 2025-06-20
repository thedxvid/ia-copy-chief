
import React, { useEffect, useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TokenAnalyticsModal } from './TokenAnalyticsModal';
import { 
  Coins, 
  RefreshCw, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Clock
} from 'lucide-react';

export const TokenWidget = () => {
  const { 
    tokens, 
    loading, 
    error, 
    lastUpdate, 
    isRefreshing,
    refreshTokens 
  } = useTokens();
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Animação de pulse quando há atualização - REMOVIDO AUTO-REFRESH CONFLITANTE
  useEffect(() => {
    if (lastUpdate) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

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
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-red-500/50 cursor-pointer">
              <Coins className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">Erro</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTokens}
                disabled={isRefreshing}
                className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Erro ao carregar créditos. Clique em refresh para tentar novamente.</p>
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

  const monthlyLimit = 25000;
  const usagePercentage = ((monthlyLimit - tokens.total_available) / monthlyLimit) * 100;
  const remainingPercentage = 100 - usagePercentage;
  const isLowTokens = remainingPercentage < 20;
  const isCritical = remainingPercentage < 10;

  // Determinar cor e ícone baseado no status
  const getStatusIcon = () => {
    if (isCritical) return <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />;
    if (isLowTokens) return <TrendingDown className="h-3 w-3 text-yellow-500" />;
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  };

  const getProgressBarColor = () => {
    if (remainingPercentage > 50) return 'from-green-500 to-green-400';
    if (remainingPercentage > 20) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const getStatusMessage = () => {
    if (isCritical) return 'Crítico';
    if (isLowTokens) return 'Atenção';
    if (remainingPercentage > 80) return 'Excelente';
    return 'Normal';
  };

  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Nunca';
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 5) return 'Agora';
    if (diffSecs < 60) return `${diffSecs}s atrás`;
    if (diffSecs < 300) return `${Math.floor(diffSecs / 60)}min atrás`;
    return lastUpdate.toLocaleTimeString();
  };

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {/* Desktop Version */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`hidden md:flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border transition-all duration-300 cursor-pointer group ${
                  pulseAnimation 
                    ? 'border-[#3B82F6] shadow-lg shadow-[#3B82F6]/20 scale-105' 
                    : 'border-[#2A2A2A] hover:border-[#3B82F6]/50'
                }`}
                onClick={() => setShowAnalytics(true)}
              >
                <div className="relative">
                  <Coins className={`h-4 w-4 transition-colors ${
                    isCritical ? 'text-red-500' : isLowTokens ? 'text-yellow-500' : 'text-[#3B82F6]'
                  }`} />
                  {pulseAnimation && (
                    <div className="absolute inset-0 rounded-full bg-[#3B82F6] animate-ping opacity-20" />
                  )}
                </div>
                
                {getStatusIcon()}
                
                <span className={`text-xs font-medium transition-colors ${
                  isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)}
                </span>
                
                {/* Barra de progresso */}
                <div className="w-16 h-2 rounded-full bg-[#2A2A2A] overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getProgressBarColor()}`}
                    style={{ width: `${remainingPercentage}%` }}
                  />
                  {pulseAnimation && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  )}
                </div>
                
                {/* Botão de refresh */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshTokens();
                  }}
                  disabled={isRefreshing}
                  className="h-5 w-5 p-0 text-gray-400 hover:text-[#3B82F6] transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                
                {/* Indicador de última atualização */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{getLastUpdateText()}</span>
                </div>
                
                <BarChart3 className="h-3 w-3 text-gray-400 group-hover:text-[#3B82F6] transition-colors" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-2 max-w-xs">
                <div className="flex items-center gap-2">
                  <strong>Status:</strong> 
                  <span className={
                    isCritical ? 'text-red-400' : 
                    isLowTokens ? 'text-yellow-400' : 
                    'text-green-400'
                  }>
                    {getStatusMessage()}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong>Disponível:</strong> {tokens.total_available.toLocaleString()} créditos</p>
                  <p><strong>Usado:</strong> {(monthlyLimit - tokens.total_available).toLocaleString()} créditos ({usagePercentage.toFixed(1)}%)</p>
                  <p><strong>Limite mensal:</strong> {monthlyLimit.toLocaleString()} créditos</p>
                  <p className="text-green-400">
                    <strong>Última atualização:</strong> {getLastUpdateText()}
                  </p>
                  {isCritical && (
                    <p className="text-red-400 font-medium">⚠️ Créditos críticos! Considere economizar.</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
                  💡 Clique para ver analytics detalhados • Atualização em tempo real ativa
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Mobile Version */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`md:hidden flex items-center gap-1 px-2 py-1.5 bg-[#1E1E1E] rounded-lg border transition-all duration-300 cursor-pointer ${
                  pulseAnimation 
                    ? 'border-[#3B82F6] shadow-lg shadow-[#3B82F6]/20' 
                    : 'border-[#2A2A2A]'
                }`}
                onClick={() => setShowAnalytics(true)}
              >
                <div className="relative">
                  <Coins className={`h-3.5 w-3.5 ${
                    isCritical ? 'text-red-500' : isLowTokens ? 'text-yellow-500' : 'text-[#3B82F6]'
                  }`} />
                  {pulseAnimation && (
                    <div className="absolute inset-0 rounded-full bg-[#3B82F6] animate-ping opacity-20" />
                  )}
                </div>
                
                {getStatusIcon()}
                
                <span className={`text-xs font-medium ${
                  isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatNumber(tokens.total_available)}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshTokens();
                  }}
                  disabled={isRefreshing}
                  className="h-4 w-4 p-0 text-gray-400 hover:text-[#3B82F6]"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <strong>{getStatusMessage()}</strong>
                </div>
                <p>{formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)} créditos</p>
                <p>Usado: {usagePercentage.toFixed(1)}%</p>
                {isCritical && <p className="text-red-400">⚠️ Créditos críticos!</p>}
                <p className="text-green-400 text-xs">
                  Atualizado: {getLastUpdateText()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Toque para analytics • Tempo real ativo</p>
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

          {/* Alerta móvel para tokens críticos */}
          {isCritical && (
            <div className="md:hidden">
              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Modal de Analytics */}
      <TokenAnalyticsModal 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
    </>
  );
};
