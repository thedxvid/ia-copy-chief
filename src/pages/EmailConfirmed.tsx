
import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EmailConfirmed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário está logado após confirmação, redirecionar para checkout
    if (user) {
      toast.success('Email confirmado com sucesso! Redirecionando para o checkout...');
      setTimeout(() => {
        navigate('/checkout');
      }, 2000);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <FadeInSection>
          <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md w-full">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl font-bold">
                Email Confirmado!
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-[#CCCCCC] text-lg leading-relaxed mb-4">
                  Parabéns! Seu email foi confirmado com sucesso.
                </p>
                <p className="text-green-400 font-semibold">
                  Você será redirecionado automaticamente para finalizar sua assinatura.
                </p>
              </div>

              <div className="bg-[#2A2A2A] p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Próximos passos:</h3>
                <ol className="text-[#CCCCCC] text-sm space-y-1 list-decimal list-inside">
                  <li>Complete o pagamento da sua assinatura</li>
                  <li>Acesse o dashboard da CopyMaster</li>
                  <li>Comece a criar copies incríveis com IA</li>
                </ol>
              </div>

              <div className="text-center">
                <Button 
                  className="w-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white"
                  asChild
                >
                  <Link to="/checkout" className="flex items-center justify-center gap-2">
                    Ir para Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-[#888888] text-sm">
                  Precisa de ajuda?{' '}
                  <a 
                    href="mailto:suporte@copymaster.app" 
                    className="text-[#3B82F6] hover:underline"
                  >
                    Entre em contato
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>
      </div>
    </div>
  );
};

export default EmailConfirmed;
