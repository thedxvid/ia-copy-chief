
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Loader2, AlertCircle, CheckCircle, Mail, Bug, Users } from 'lucide-react';
import { UserTable } from './UserTable';

export const UserActivator: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastActivated, setLastActivated] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
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
    setDebugInfo(null);
    
    try {
      console.log("=== ADMIN: Starting user activation ===");
      console.log("Email:", email.trim());
      
      const { data, error } = await supabase.functions.invoke('activate-user', {
        body: { email: email.trim().toLowerCase() },
      });

      console.log("=== ADMIN: Function response ===");
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) {
        console.error("Function invocation error:", error);
        setDebugInfo(`Erro na função: ${JSON.stringify(error)}`);
        throw new Error(error.message || "Erro desconhecido na função");
      }

      if (data?.error) {
        console.error("Function returned error:", data.error);
        setDebugInfo(`Erro retornado: ${data.error}`);
        throw new Error(data.error);
      }

      // Sucesso
      const successMessage = data?.isNewUser 
        ? `✅ Usuário criado e ativado! ${data?.emailSent ? 'Email enviado com sucesso' : 'Atenção: Email pode não ter sido enviado'}`
        : `✅ Usuário ativado! ${email.trim()} foi ativado por 30 dias com 25.000 tokens`;

      toast({
        title: data?.isNewUser ? "🎉 Novo Usuário Criado!" : "✅ Usuário Ativado!",
        description: data?.isNewUser 
          ? `${email.trim()} foi criado e ativado com sucesso. ${data?.emailSent ? 'Email de boas-vindas enviado!' : 'Verifique os logs para o status do email.'}`
          : `${email.trim()} foi ativado por 30 dias com 25.000 tokens`,
      });

      setLastActivated(email.trim());
      setEmail('');
      setDebugInfo(`Sucesso! ${data?.isNewUser ? 'Novo usuário criado' : 'Usuário existente ativado'}. Email: ${data?.emailSent ? 'Enviado' : 'Status desconhecido'}`);
      
    } catch (error: any) {
      console.error('=== ADMIN: Error activating user ===', error);
      
      let errorMessage = "Erro ao ativar usuário";
      if (error.message) {
        errorMessage = error.message;
      }
      
      setDebugInfo(`Erro: ${errorMessage}`);
      
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
    <div className="space-y-6">
      <Tabs defaultValue="activate" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1E1E1E] border border-[#4B5563]">
          <TabsTrigger 
            value="activate" 
            className="text-[#CCCCCC] data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Ativar Usuário
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            className="text-[#CCCCCC] data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Lista de Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activate" className="space-y-4">
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
                <div className="flex items-center gap-1 text-[#888888] text-xs">
                  <Mail className="w-3 h-3" />
                  <span>Email de boas-vindas será enviado para novos usuários</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {debugInfo && (
            <Card className="bg-[#2A2A2A] border-[#4B5563] max-w-md">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-xs">
                  <Bug className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-300">
                    <strong>Debug Info:</strong>
                    <div className="mt-1 text-[#CCCCCC] font-mono break-all">
                      {debugInfo}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
        </TabsContent>

        <TabsContent value="list">
          <UserTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};
