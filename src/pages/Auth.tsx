
import React from 'react';
import { Header } from '@/components/layout/Header';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate, useSearchParams } from 'react-router-dom';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
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

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {authMode === 'login' && 'Entrar'}
              {authMode === 'signup' && 'Criar Conta'}
              {authMode === 'forgot' && 'Recuperar Senha'}
            </h1>
            <p className="text-[#CCCCCC]">
              {authMode === 'login' && 'Entre em sua conta para continuar'}
              {authMode === 'signup' && 'Crie sua conta para começar'}
              {authMode === 'forgot' && 'Digite seu email para recuperar a senha'}
            </p>
          </div>

          {authMode === 'login' && (
            <LoginForm 
              onSwitchToSignUp={() => setAuthMode('signup')}
              onSwitchToForgot={() => setAuthMode('forgot')}
            />
          )}
          {authMode === 'signup' && (
            <SignUpForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
          {authMode === 'forgot' && (
            <ForgotPasswordForm onBackToLogin={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
