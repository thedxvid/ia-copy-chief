
import React from 'react';
import { Header } from '@/components/layout/Header';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login');
  const { user, loading: authLoading, isFirstLogin } = useAuth();
  const { subscription, loading: subscriptionLoading, isSubscriptionActive } = useSubscription();

  // Lista de emails de administradores definitivos
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  if (user) {
    // Se é primeiro login, redirecionar para alteração de senha
    if (isFirstLogin) {
      return <Navigate to="/change-password" replace />;
    }
    
    // Se é admin, redirecionar direto para dashboard
    if (isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Se o usuário tem status "pending", redirecionar para checkout
    if (subscription?.subscription_status === 'pending') {
      return <Navigate to="/checkout" replace />;
    }
    
    // Se tem subscription ativa, redirecionar para dashboard
    if (isSubscriptionActive) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Para outros status, redirecionar para checkout
    return <Navigate to="/checkout" replace />;
  }

  const handleGetAccess = () => {
    window.open('https://clkdmg.site/subscribe/iacopychief-assinatura-mensal', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {authMode === 'login' && 'Entrar'}
              {authMode === 'forgot' && 'Recuperar Senha'}
            </h1>
            <p className="text-[#CCCCCC]">
              {authMode === 'login' && 'Entre em sua conta para continuar'}
              {authMode === 'forgot' && 'Digite seu email para recuperar a senha'}
            </p>
          </div>

          {authMode === 'login' && (
            <LoginForm 
              onSwitchToForgot={() => setAuthMode('forgot')}
            />
          )}
          {authMode === 'forgot' && (
            <ForgotPasswordForm onBackToLogin={() => setAuthMode('login')} />
          )}

          {authMode === 'login' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] px-2 text-gray-400">
                    Novo por aqui?
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-4">
                    Para ter acesso à plataforma, você precisa fazer sua assinatura primeiro.
                    Após o pagamento, sua conta será criada automaticamente e você receberá
                    as credenciais por email.
                  </p>
                  
                  <Button
                    onClick={handleGetAccess}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assinar Agora
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Ao assinar, você concorda com nossos{" "}
                    <a href="/terms" className="underline hover:text-gray-400">
                      Termos de Serviço
                    </a>{" "}
                    e{" "}
                    <a href="/privacy" className="underline hover:text-gray-400">
                      Política de Privacidade
                    </a>.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
