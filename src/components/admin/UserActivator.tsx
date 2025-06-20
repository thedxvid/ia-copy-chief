
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

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    setDebugInfo(null);
    
    try {
      console.log("=== ADMIN: Starting user activation ===");
      console.log("Email:", normalizedEmail);
      
      const { data, error } = await supabase.functions.invoke('activate-user', {
        body: { email: normalizedEmail },
      });

      console.log("=== ADMIN: Function response ===");
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) {
        console.error("Function invocation error:", error);
        
        let errorMessage = "Erro desconhecido na função";
        let debugMessage = `❌ Erro na invocação da função:
Tipo: ${error.name || 'FunctionsHttpError'}
Status: ${error.status || 'unknown'}
Message: ${error.message || 'unknown'}
Context: ${JSON.stringify(error.context || {}, null, 2)}

Detalhes do erro:
${JSON.stringify(error, null, 2)}

Possíveis causas:
- Erro interno na função Edge
- Problemas de conexão com o banco de dados
- Configuração incorreta de variáveis de ambiente
- Falha na criação/atualização do perfil do usuário`;
        
        if (error.message) {
          if (error.message.includes("Edge Function returned a non-2xx status code")) {
            errorMessage = "Erro interno na função de ativação. Verifique os logs para mais detalhes.";
          } else {
            errorMessage = error.message;
          }
        }
        
        setDebugInfo(debugMessage);
        
        toast({
          title: "❌ Erro na Ativação",
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }

      if (data?.error) {
        console.error("Function returned error:", data.error);
        
        let errorMessage = data.error;
        let debugMessage = `❌ Erro retornado pela função:
Erro: ${data.error}
Tipo: ${data.errorType || 'não especificado'}`;
        
        if (data.details) {
          debugMessage += `\nDetalhes: ${data.details}`;
        }
        
        if (data.stack) {
          debugMessage += `\nStack trace: ${data.stack}`;
        }
        
        setDebugInfo(debugMessage);
        
        toast({
          title: "❌ Erro na Ativação",
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }

      // Sucesso
      toast({
        title: data?.isNewUser ? "🎉 Novo Usuário Criado!" : "✅ Usuário Ativado!",
        description: data?.isNewUser 
          ? `${normalizedEmail} foi criado e ativado com sucesso. ${data?.emailSent ? 'Email de boas-vindas enviado!' : 'Verifique os logs para o status do email.'}`
          : `${normalizedEmail} foi ativado por 30 dias com 25.000 tokens`,
      });

      setLastActivated(normalizedEmail);
      setEmail('');
      
      let debugSuccessInfo = `✅ Ativação realizada com sucesso!

📊 Resumo da operação:
${data?.isNewUser ? '👤 Novo usuário criado' : '🔄 Usuário existente ativado'}
📧 Email: ${normalizedEmail}
🆔 User ID: ${data?.user_id || 'não informado'}
📬 Email enviado: ${data?.emailSent ? 'Sim ✅' : 'Não ❌'}
🔑 Senha temporária: ${data?.temporaryPassword || 'não informada'}
⏰ Expira em: ${data?.subscription_expires_at ? new Date(data.subscription_expires_at).toLocaleDateString('pt-BR') : 'não informado'}

🎯 Status: Assinatura ativa por 30 dias
💎 Tokens: 25.000 tokens disponíveis`;
      
      setDebugInfo(debugSuccessInfo);
      
    } catch (error: any) {
      console.error('=== ADMIN: Error activating user ===', error);
      
      let errorMessage = "Erro crítico ao ativar usuário";
      let debugMessage = `❌ Erro crítico capturado no frontend:
Tipo: ${error.name || 'UnknownError'}
Mensagem: ${error.message || 'Erro desconhecido'}

Stack trace completo:
${error.stack || 'Não disponível'}

Detalhes do objeto de erro:
${JSON.stringify(error, null, 2)}

🔍 Passos para diagnóstico:
1. Verificar se as variáveis de ambiente estão configuradas
2. Verificar se a função Edge está funcionando
3. Verificar se o banco de dados está acessível
4. Verificar se a tabela profiles existe e está configurada corretamente`;
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erro Crítico",
        description: errorMessage,
        variant: "destructive",
      });

      setDebugInfo(debugMessage);
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
            <Card className="bg-[#2A2A2A] border-[#4B5563] max-w-4xl">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-xs">
                  <Bug className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-300 w-full">
                    <strong>Informações de Debug:</strong>
                    <div className="mt-1 text-[#CCCCCC] font-mono break-all whitespace-pre-wrap max-h-96 overflow-y-auto bg-[#1A1A1A] p-3 rounded border border-[#4B5563]">
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
