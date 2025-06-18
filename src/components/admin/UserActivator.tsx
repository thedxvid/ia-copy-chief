
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const UserActivator: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastActivated, setLastActivated] = useState<string | null>(null);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleActivateUser = async () => {
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email.trim())) {
      toast({
        title: "Erro",
        description: "Formato de email inválido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting to activate user:", email.trim());
      
      const { data, error } = await supabase.functions.invoke('activate-user', {
        body: { email: email.trim().toLowerCase() },
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error("Function error:", error);
        throw new Error(error.message || "Erro desconhecido na função");
      }

      if (data?.error) {
        console.error("Data error:", data.error);
        throw new Error(data.error);
      }

      toast({
        title: "✅ Usuário Ativado!",
        description: `${email.trim()} foi ativado por 30 dias com 25.000 tokens`,
      });

      setLastActivated(email.trim());
      setEmail('');
      
    } catch (error: any) {
      console.error('Error activating user:', error);
      
      let errorMessage = "Erro ao ativar usuário";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleActivateUser();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Ativador de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email do usuário (ex: usuario@email.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888]"
              disabled={loading}
            />
          </div>
          
          <Button
            onClick={handleActivateUser}
            disabled={loading || !email.trim()}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Ativar Usuário (30 dias)
              </>
            )}
          </Button>
          
          <div className="space-y-2 text-sm">
            <p className="text-[#888888] text-center">
              Ativa acesso temporário por 30 dias com 25.000 tokens
            </p>
            <div className="flex items-center gap-1 text-[#888888] text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Se o usuário não existir, será criado automaticamente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {lastActivated && (
        <Card className="bg-[#065F46] border-[#10B981] max-w-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-[#A7F3D0]">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">
                Último usuário ativado: <strong>{lastActivated}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
