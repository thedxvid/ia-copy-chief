
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyResetToken = async () => {
      console.log('🔍 Verificando token de recuperação...');
      
      // Verificar se temos os parâmetros necessários na URL
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      console.log('🔗 URL params:', { token: token ? 'presente' : 'ausente', type });
      
      if (!token || type !== 'recovery') {
        console.error('❌ Token ou tipo inválido:', { token: !!token, type });
        setValidToken(false);
        toast.error('Link de recuperação inválido ou expirado');
        
        // Redirecionar para auth após 3 segundos
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
        return;
      }

      try {
        // Verificar se o token é válido tentando obter a sessão
        console.log('🔐 Verificando validade do token...');
        
        // O Supabase deve processar automaticamente o token quando a página carrega
        // Vamos verificar se temos uma sessão válida
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setValidToken(false);
          toast.error('Erro ao verificar link de recuperação');
          return;
        }

        if (session) {
          console.log('✅ Token válido, sessão encontrada');
          setValidToken(true);
        } else {
          console.log('⚠️ Nenhuma sessão encontrada, mas token presente na URL');
          // Mesmo sem sessão, se o token está na URL, vamos permitir tentar
          setValidToken(true);
        }
        
      } catch (error) {
        console.error('❌ Erro ao verificar token:', error);
        setValidToken(false);
        toast.error('Erro ao processar link de recuperação');
      }
    };

    verifyResetToken();
  }, [searchParams, navigate]);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('Pelo menos 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Pelo menos 1 letra maiúscula');
    if (!/[a-z]/.test(password)) errors.push('Pelo menos 1 letra minúscula');
    if (!/[0-9]/.test(password)) errors.push('Pelo menos 1 número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pelo menos 1 símbolo');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      toast.error(`Senha inválida: ${passwordErrors.join(', ')}`);
      return;
    }

    setLoading(true);
    console.log('🔐 Iniciando atualização de senha...');

    try {
      // Atualizar a senha usando o token da URL
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        
        // Tratamento específico para diferentes tipos de erro
        if (error.message.includes('session_not_found') || error.message.includes('invalid_token')) {
          toast.error('Link de recuperação expirado ou inválido. Solicite um novo link.');
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
        } else {
          toast.error(error.message || 'Erro ao alterar senha');
        }
        return;
      }

      console.log('✅ Senha alterada com sucesso:', data);
      toast.success('Senha alterada com sucesso!');
      
      // Fazer logout para garantir que o usuário faça login com a nova senha
      await supabase.auth.signOut();
      
      // Redirecionar para login após sucesso
      setTimeout(() => {
        navigate('/auth');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erro inesperado ao alterar senha:', error);
      toast.error('Erro inesperado ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAuth = () => {
    navigate('/auth');
  };

  // Se ainda estamos verificando o token
  if (validToken === null) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mb-4"></div>
            <p className="text-white text-center">Verificando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se o token é inválido
  if (validToken === false) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Link Inválido</CardTitle>
            <CardDescription className="text-[#CCCCCC]">
              O link de recuperação é inválido ou expirou
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-[#CCCCCC] text-center text-sm">
              Solicite um novo link de recuperação na página de login
            </p>
            
            <Button
              onClick={handleBackToAuth}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordErrors = validatePassword(newPassword);
  const isPasswordValid = passwordErrors.length === 0;

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-white text-2xl">Redefinir Senha</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Digite sua nova senha para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            {/* Validações de senha */}
            {newPassword && (
              <div className="space-y-2">
                <Label className="text-white text-sm">Requisitos da senha:</Label>
                <div className="space-y-1">
                  {[
                    { check: newPassword.length >= 8, text: 'Pelo menos 8 caracteres' },
                    { check: /[A-Z]/.test(newPassword), text: 'Pelo menos 1 letra maiúscula' },
                    { check: /[a-z]/.test(newPassword), text: 'Pelo menos 1 letra minúscula' },
                    { check: /[0-9]/.test(newPassword), text: 'Pelo menos 1 número' },
                    { check: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'Pelo menos 1 símbolo' },
                  ].map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {requirement.check ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={requirement.check ? 'text-green-400' : 'text-red-400'}>
                        {requirement.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso de senhas diferentes */}
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>As senhas não coincidem</span>
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading || !isPasswordValid || newPassword !== confirmPassword}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Alterando senha...
                  </div>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToAuth}
                className="w-full border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
