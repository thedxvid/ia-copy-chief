import React, { useEffect, useState, useRef } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TokenAnalyticsModal } from './TokenAnalyticsModal';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import { 
  Coins, 
  RefreshCw, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  BarChart3,
  Plus
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
  const [showPurchase, setShowPurchase] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  
  // Ref para armazenar o valor anterior dos tokens
  const previousTokensRef = useRef<number | null>(null);

  // Animação de pulse apenas quando há mudança real nos valores
  useEffect(() => {
    if (tokens && previousTokensRef.current !== null) {
      // Só anima se houve mudança real nos tokens disponíveis
      if (previousTokensRef.current !== tokens.total_available) {
        setPulseAnimation(true);
        const timer = setTimeout(() => setPulseAnimation(false), 1000);
        return () => clearTimeout(timer);
      }
    }
    
    // Atualiza a referência do valor anterior
    if (tokens) {
      previousTokensRef.current = tokens.total_available;
    }
  }, [tokens?.total_available]);

  const handleRefreshClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    refreshTokens(true);
  };

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
                onClick={handleRefreshClick}
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

  const monthlyLimit = 100000; // Atualizado para 100k
  const usagePercentage = ((monthlyLimit - tokens.total_available) / monthlyLimit) * 100;
  const remainingPercentage = 100 - usagePercentage;
  const isLowTokens = remainingPercentage < 20;
  const isCritical = remainingPercentage < 10;

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
                
                {isCritical ? (
                  <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                ) : isLowTokens ? (
                  <TrendingDown className="h-3 w-3 text-yellow-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
                
                <span className={`text-xs font-medium transition-colors ${
                  isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)}
                </span>
                
                {/* Barra de progresso */}
                <div className="w-16 h-2 rounded-full bg-[#2A2A2A] overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      remainingPercentage > 50 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                      remainingPercentage > 20 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                      'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
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
                  onClick={handleRefreshClick}
                  disabled={isRefreshing}
                  className="h-5 w-5 p-0 text-gray-400 hover:text-[#3B82F6] transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                
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
                    {isCritical ? 'Crítico' : isLowTokens ? 'Atenção' : 'Normal'}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong>Disponível:</strong> {tokens.total_available.toLocaleString()} créditos</p>
                  <p><strong>Usado:</strong> {(monthlyLimit - tokens.total_available).toLocaleString()} créditos ({usagePercentage.toFixed(1)}%)</p>
                  <p><strong>Limite mensal:</strong> {monthlyLimit.toLocaleString()} créditos</p>
                  {isCritical && (
                    <p className="text-red-400 font-medium">⚠️ Créditos críticos! Considere comprar mais tokens.</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
                  💡 Clique para ver analytics detalhados
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Botão de Compra */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPurchase(true)}
            className="hidden lg:flex items-center gap-1 h-8 px-2 text-xs bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Comprar
          </Button>

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
                <Coins className={`h-3.5 w-3.5 ${
                  isCritical ? 'text-red-500' : isLowTokens ? 'text-yellow-500' : 'text-[#3B82F6]'
                }`} />
                
                <span className={`text-xs font-medium ${
                  isCritical ? 'text-red-400' : isLowTokens ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatNumber(tokens.total_available)}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshClick}
                  disabled={isRefreshing}
                  className="h-4 w-4 p-0 text-gray-400 hover:text-[#3B82F6]"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <p>{formatNumber(tokens.total_available)} / {formatNumber(monthlyLimit)} créditos</p>
                <p>Usado: {usagePercentage.toFixed(1)}%</p>
                {isCritical && <p className="text-red-400">⚠️ Créditos críticos!</p>}
                <p className="text-xs text-gray-400 mt-1">Toque para analytics</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Modais */}
      <TokenAnalyticsModal 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
      
      <TokenPurchaseModal 
        isOpen={showPurchase} 
        onClose={() => setShowPurchase(false)} 
      />
    </>
  );
};
