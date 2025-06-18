
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error(error.message || 'Erro ao enviar email de recuperação');
      } else {
        setEmailSent(true);
        toast.success('Email de recuperação enviado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-[#3B82F6]/20 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-[#3B82F6]" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Email enviado!</h3>
          <p className="text-sm text-gray-400">
            Enviamos um link de recuperação para <strong>{email}</strong>.
            Verifique sua caixa de entrada e siga as instruções.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Não recebeu o email? Verifique a pasta de spam.
          </p>
          
          <Button
            variant="outline"
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Tentar novamente
          </Button>
        </div>

        {onBackToLogin && (
          <Button
            variant="link"
            onClick={onBackToLogin}
            className="text-[#3B82F6] hover:text-[#2563EB]"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar ao login
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite seu email cadastrado"
          required
          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
        />
        <p className="text-xs text-gray-400">
          Enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enviando...
            </div>
          ) : (
            'Enviar link de recuperação'
          )}
        </Button>

        {onBackToLogin && (
          <Button
            type="button"
            variant="outline"
            onClick={onBackToLogin}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar ao login
          </Button>
        )}
      </div>
    </form>
  );
};
