import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription';
import { paymentService } from '@/services/paymentService';

export const SubscriptionStatus = () => {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  const handleUpgrade = () => {
    setIsRedirecting(true);
    // Usar novo link do Digital Guru Manager
    window.open('https://clkdmg.site/subscribe/iacopychief-assinatura-mensal', '_blank');
    setTimeout(() => setIsRedirecting(false), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <div className="bg-[#1E1E1E] p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Status da Assinatura
        </h2>
        {subscription?.subscription_status === 'active' ? (
          <>
            <p className="text-green-500 text-lg mb-4">
              Sua assinatura está ativa! 🎉
            </p>
            <p className="text-gray-400 mb-4">
              Aproveite todos os recursos do IA Copy Chief.
            </p>
          </>
        ) : subscription?.subscription_status === 'pending' ? (
          <>
            <p className="text-yellow-500 text-lg mb-4">
              Aguardando Pagamento... ⏳
            </p>
            <p className="text-gray-400 mb-4">
              Estamos aguardando a confirmação do seu pagamento.
              Isso pode levar alguns minutos.
            </p>
            <Button disabled={isRedirecting} onClick={handleUpgrade} className="bg-[#3B82F6] text-white rounded-full hover:bg-[#2563EB] transition-colors">
              {isRedirecting ? (
                <>
                  Redirecionando...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : 'Gerenciar Assinatura'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-red-500 text-lg mb-4">
              Sua assinatura está inativa. 😞
            </p>
            <p className="text-gray-400 mb-4">
              Para continuar aproveitando todos os recursos, renove sua assinatura.
            </p>
            <Button disabled={isRedirecting} onClick={handleUpgrade} className="bg-[#3B82F6] text-white rounded-full hover:bg-[#2563EB] transition-colors">
              {isRedirecting ? (
                <>
                  Redirecionando...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : 'Assinar Agora'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
