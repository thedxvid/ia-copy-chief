
import React, { useEffect, useState } from 'react';
import { useRealtimeTokens } from '@/hooks/useRealtimeTokens';
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
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';

export const TokenWidget = () => {
  const { tokens, isConnected, lastUpdate } = useRealtimeTokens();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Animação de pulse quando há atualização
  useEffect(() => {
    if (lastUpdate) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  useEffect(() => {
    if (tokens) {
      setLoading(false);
      setError(null);
    }
  }, [tokens]);

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
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] cursor-pointer">
              <Coins className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">Erro</span>
              <RefreshCw className="h-3 w-3 text-gray-400 hover:text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Erro ao carregar tokens. Sistema offline.</p>
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
                
                {/* Indicador de conexão realtime */}
                <div className="relative">
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-gray-500" />
                  )}
                </div>
                
                {getStatusIcon()}
                
                <span className={`text-xs font-medium transition-colors ${
                  isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)}
                </span>
                
                {/* Barra de progresso aprimorada */}
                <div className="w-16 h-2 rounded-full bg-[#2A2A2A] overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getProgressBarColor()}`}
                    style={{ width: `${remainingPercentage}%` }}
                  />
                  {pulseAnimation && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  )}
                </div>
                
                {/* Mini indicador de última atualização */}
                {lastUpdate && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
                
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
                  {isConnected ? (
                    <Zap className="h-3 w-3 text-green-500" title="Tempo real ativo" />
                  ) : (
                    <span className="text-gray-400 text-xs">Offline</span>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong>Disponível:</strong> {tokens.total_available.toLocaleString()} tokens</p>
                  <p><strong>Usado:</strong> {(monthlyLimit - tokens.total_available).toLocaleString()} tokens ({usagePercentage.toFixed(1)}%)</p>
                  <p><strong>Limite mensal:</strong> {monthlyLimit.toLocaleString()} tokens</p>
                  {lastUpdate && (
                    <p className="text-green-400">
                      <strong>Última atualização:</strong> {lastUpdate.toLocaleTimeString()}
                    </p>
                  )}
                  {isCritical && (
                    <p className="text-red-400 font-medium">⚠️ Tokens críticos! Considere economizar.</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
                  💡 Clique para ver analytics detalhados
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
                
                {isConnected ? (
                  <Wifi className="h-2.5 w-2.5 text-green-500" />
                ) : (
                  <WifiOff className="h-2.5 w-2.5 text-gray-500" />
                )}
                
                {getStatusIcon()}
                
                <span className={`text-xs font-medium ${
                  isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatNumber(tokens.total_available)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <strong>{getStatusMessage()}</strong>
                  {isConnected && <Zap className="h-3 w-3 text-green-500" />}
                </div>
                <p>{formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)} tokens</p>
                <p>Usado: {usagePercentage.toFixed(1)}%</p>
                {isCritical && <p className="text-red-400">⚠️ Tokens críticos!</p>}
                {lastUpdate && (
                  <p className="text-green-400 text-xs">
                    Atualizado: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Toque para analytics</p>
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
