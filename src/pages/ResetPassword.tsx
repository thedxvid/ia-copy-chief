
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
      console.log('🔍 [RESET] Iniciando verificação de token...');
      console.log('🔗 [RESET] URL completa:', window.location.href);
      console.log('🔗 [RESET] Hash:', window.location.hash);
      console.log('🔗 [RESET] Search params:', window.location.search);
      
      // Extrair todos os possíveis parâmetros da URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Verificar parâmetros no hash (formato novo do Supabase)
      const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
      const tokenHash = hashParams.get('token_hash') || urlParams.get('token_hash');
      const type = hashParams.get('type') || urlParams.get('type');
      
      // Verificar parâmetros no search (formato antigo)
      const token = urlParams.get('token');
      
      console.log('🔗 [RESET] Parâmetros detectados:', { 
        accessToken: accessToken ? 'presente' : 'ausente',
        refreshToken: refreshToken ? 'presente' : 'ausente',
        tokenHash: tokenHash ? 'presente' : 'ausente',
        type,
        token: token ? 'presente' : 'ausente'
      });

      try {
        // Primeiro, tentar com access_token e refresh_token (formato novo)
        if (accessToken && refreshToken) {
          console.log('🔐 [RESET] Tentando configurar sessão com access/refresh tokens...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ [RESET] Erro ao configurar sessão:', error);
            throw error;
          }
          
          if (data.session) {
            console.log('✅ [RESET] Sessão configurada com sucesso!');
            setValidToken(true);
            return;
          }
        }
        
        // Se não temos tokens, tentar verificar sessão atual
        console.log('🔐 [RESET] Verificando sessão atual...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [RESET] Erro ao verificar sessão:', sessionError);
          throw sessionError;
        }

        if (session) {
          console.log('✅ [RESET] Sessão válida encontrada!');
          setValidToken(true);
          return;
        }

        // Se chegou até aqui, não temos uma sessão válida
        console.log('⚠️ [RESET] Nenhuma sessão válida encontrada');
        setValidToken(false);
        toast.error('Link de recuperação inválido ou expirado');
        
      } catch (error: any) {
        console.error('❌ [RESET] Erro na verificação do token:', error);
        setValidToken(false);
        
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          toast.error('Link de recuperação expirado. Solicite um novo link.');
        } else {
          toast.error('Erro ao processar link de recuperação');
        }
      }
    };

    verifyResetToken();
  }, []);

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
    
    console.log('🔐 [RESET] Iniciando processo de alteração de senha...');

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

    try {
      console.log('🔐 [RESET] Chamando updateUser...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      console.log('🔐 [RESET] Resposta do updateUser:', { data, error });

      if (error) {
        console.error('❌ [RESET] Erro ao atualizar senha:', error);
        
        if (error.message.includes('session_not_found') || 
            error.message.includes('invalid_token') ||
            error.message.includes('expired')) {
          toast.error('Sessão expirada. Solicite um novo link de recuperação.');
          setTimeout(() => navigate('/auth'), 2000);
        } else {
          toast.error(error.message || 'Erro ao alterar senha');
        }
        return;
      }

      console.log('✅ [RESET] Senha alterada com sucesso!');
      toast.success('Senha alterada com sucesso! Redirecionando para o login...');
      
      // Fazer logout para limpar a sessão de recuperação
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/auth');
      }, 1500);

    } catch (error: any) {
      console.error('❌ [RESET] Erro inesperado:', error);
      toast.error('Erro inesperado ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAuth = () => {
    navigate('/auth');
  };

  const handleRequestNewLink = () => {
    navigate('/auth');
    toast.info('Solicite um novo link de recuperação na tela de login');
  };

  // Loading state
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

  // Invalid token state
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
            
            <div className="space-y-2">
              <Button
                onClick={handleRequestNewLink}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                Solicitar Novo Link
              </Button>
              
              <Button
                onClick={handleBackToAuth}
                variant="outline"
                className="w-full border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Button>
            </div>
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

            {/* Password validation */}
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

            {/* Password mismatch warning */}
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
