
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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

    try {
      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Marcar que não é mais primeiro login
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_login: false })
        .eq('id', user?.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      toast.success('Senha alterada com sucesso!');
      
      // Redirecionar para dashboard após sucesso
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const passwordErrors = validatePassword(newPassword);
  const isPasswordValid = passwordErrors.length === 0;

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-white text-2xl">Alterar Senha</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Por segurança, você precisa alterar sua senha temporária antes de continuar
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
                'Alterar Senha'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-yellow-200 text-sm">
                <p className="font-medium mb-1">Importante:</p>
                <p>Esta é uma senha temporária gerada pelo administrador. Por questões de segurança, você deve escolher uma nova senha forte.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;
