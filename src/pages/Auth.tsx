
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return <LoginForm />;
      case 'signup':
        return <SignUpForm />;
      case 'forgot-password':
        return <ForgotPasswordForm onBack={() => setMode('login')} />;
      default:
        return <LoginForm />;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Entrar na sua conta';
      case 'signup':
        return 'Criar nova conta';
      case 'forgot-password':
        return 'Recuperar senha';
      default:
        return 'Entrar na sua conta';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Digite suas credenciais para acessar o CopyChief';
      case 'signup':
        return 'Crie sua conta e comece a criar copies persuasivas';
      case 'forgot-password':
        return 'Digite seu email para receber instruções de recuperação';
      default:
        return 'Digite suas credenciais para acessar o CopyChief';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">CopyChief</h1>
          <p className="text-gray-400">Plataforma de IA para Copy Persuasiva</p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">{getTitle()}</CardTitle>
            <CardDescription className="text-gray-400">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderForm()}
            
            {mode === 'login' && (
              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Esqueceu sua senha?
                  </Button>
                </div>
                <div className="text-center text-sm text-gray-400">
                  Não tem uma conta?{' '}
                  <Button
                    variant="link"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:text-primary/80 p-0"
                  >
                    Criar conta
                  </Button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="mt-6 text-center text-sm text-gray-400">
                Já tem uma conta?{' '}
                <Button
                  variant="link"
                  onClick={() => setMode('login')}
                  className="text-primary hover:text-primary/80 p-0"
                >
                  Fazer login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
