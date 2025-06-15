
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Loader2 } from 'lucide-react';

export const UserActivator: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleActivateUser = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('activate-user', {
        body: { email },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Usuário Ativado!",
        description: `${email} foi ativado por 30 dias`,
      });

      setEmail('');
    } catch (error: any) {
      console.error('Error activating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao ativar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Ativador de Usuários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="email"
          placeholder="Email do usuário"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#2A2A2A] border-[#4B5563] text-white"
        />
        <Button
          onClick={handleActivateUser}
          disabled={loading}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ativando...
            </>
          ) : (
            'Ativar Usuário (30 dias)'
          )}
        </Button>
        <p className="text-sm text-[#888888] text-center">
          Ativa acesso temporário por 30 dias para testes
        </p>
      </CardContent>
    </Card>
  );
};
