
import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { toast } from 'sonner';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleResendEmail = () => {
    // Aqui você pode implementar a lógica para reenviar o email
    toast.success('Email de confirmação reenviado!');
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <FadeInSection>
          <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md w-full">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl font-bold">
                Confirme seu Email
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-[#CCCCCC] text-lg leading-relaxed mb-4">
                  Enviamos um email de confirmação para:
                </p>
                <p className="text-[#3B82F6] font-semibold text-lg bg-[#2A2A2A] px-4 py-2 rounded-lg">
                  {email}
                </p>
              </div>

              <div className="bg-[#2A2A2A] p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Próximos passos:</h3>
                <ol className="text-[#CCCCCC] text-sm space-y-1 list-decimal list-inside">
                  <li>Verifique sua caixa de entrada</li>
                  <li>Clique no link de confirmação</li>
                  <li>Faça login para acessar a plataforma</li>
                </ol>
              </div>

              <div className="text-center">
                <p className="text-[#888888] text-sm mb-4">
                  Não recebeu o email? Verifique sua pasta de spam ou
                </p>
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full mb-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reenviar Email
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-[#4B5563]">
                <Button variant="ghost" asChild>
                  <Link to="/auth" className="flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Login
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

export default EmailConfirmation;
