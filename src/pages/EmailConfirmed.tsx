
import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EmailConfirmed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      toast.success('Email confirmado com sucesso! 🎉', {
        description: 'Redirecionando para finalizar sua assinatura...'
      });
      setTimeout(() => {
        navigate('/checkout');
      }, 3000);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-600 to-purple-600 bg-[length:400%_400%] animate-[gradientShift_15s_ease_infinite]">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <FadeInSection>
          <Card className="bg-white/95 backdrop-blur-md border-none shadow-2xl max-w-lg w-full animate-[slideUp_0.8s_ease-out]">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center animate-[pulse_2s_infinite] shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-gray-800 text-3xl font-bold mb-3">
                🎉 Email Confirmado!
              </CardTitle>
              <p className="text-gray-600 text-lg leading-relaxed">
                Parabéns! Seu email foi confirmado com sucesso e sua conta está ativa.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-semibold text-lg">
                    Bem-vindo à CopyMaster!
                  </p>
                </div>
                <p className="text-green-600">
                  Você será redirecionado automaticamente para finalizar sua assinatura.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  O que vem a seguir:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <p className="text-gray-600 text-sm">Complete o pagamento da sua assinatura</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <p className="text-gray-600 text-sm">Acesse o dashboard da CopyMaster</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <p className="text-gray-600 text-sm">Comece a criar copies incríveis com IA</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <p className="text-amber-800 font-semibold text-sm">Oferta Limitada</p>
                </div>
                <p className="text-amber-700 text-sm">
                  Apenas <strong>R$ 97/mês</strong> (valor normal R$ 1.132/mês). 
                  Esta promoção é válida apenas para novos usuários.
                </p>
              </div>

              <div className="text-center space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                  asChild
                >
                  <Link to="/checkout" className="flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    Finalizar Assinatura Agora
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                
                <p className="text-gray-500 text-xs">
                  Redirecionamento automático em alguns segundos...
                </p>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
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

      <style jsx>{`
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

export default EmailConfirmed;
