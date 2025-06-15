
import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email não encontrado');
      return;
    }

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
        }
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          toast.error('Aguarde alguns minutos antes de solicitar um novo email');
        } else {
          toast.error('Erro ao reenviar email. Tente novamente.');
        }
      } else {
        toast.success('Email de confirmação reenviado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-blue-500 bg-[length:400%_400%] animate-[gradientShift_15s_ease_infinite]">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <FadeInSection>
          <Card className="bg-white/95 backdrop-blur-md border-none shadow-2xl max-w-lg w-full animate-[slideUp_0.8s_ease-out]">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-[pulse_2s_infinite] shadow-lg">
                  <Mail className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-gray-800 text-3xl font-bold mb-3">
                Confirme seu cadastro
              </CardTitle>
              <p className="text-gray-600 text-lg leading-relaxed">
                Estamos quase terminando! Verifique seu e-mail e clique no link de confirmação que enviamos para você.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gray-50 border-l-4 border-blue-500 rounded-lg p-5">
                <p className="text-gray-600 mb-2">E-mail de confirmação enviado para:</p>
                <p className="text-blue-600 font-semibold text-lg break-all">
                  {email}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Próximos passos:
                </h3>
                <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside ml-4">
                  <li>Verifique sua caixa de entrada</li>
                  <li>Clique no link "Confirmar Email" no email</li>
                  <li>Será redirecionado automaticamente para finalizar sua assinatura</li>
                </ol>
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-500 text-sm">
                  Não recebeu o email? Verifique sua pasta de spam ou
                </p>
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Reenviando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Reenviar Email
                    </div>
                  )}
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <Button variant="ghost" asChild className="text-blue-600 hover:text-blue-700">
                  <Link to="/auth" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Login
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-gray-500 text-sm leading-relaxed">
                  Se você não conseguir encontrar o e-mail, verifique sua pasta de spam ou lixo eletrônico.
                  <br />
                  Precisa de ajuda?{' '}
                  <a 
                    href="mailto:suporte@copymaster.app" 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Entre em contato
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EmailConfirmation;
