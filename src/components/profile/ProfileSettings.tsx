import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, LogOut, Camera, Save, Upload, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const getInitials = (name: string | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('Pelo menos 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Pelo menos 1 letra maiúscula');
    if (!/[a-z]/.test(password)) errors.push('Pelo menos 1 letra minúscula');
    if (!/[0-9]/.test(password)) errors.push('Pelo menos 1 número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pelo menos 1 símbolo');
    return errors;
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos de senha.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      toast({
        title: "Senha inválida",
        description: passwordErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      // Marcar que não é mais primeiro login se aplicável
      await supabase
        .from('profiles')
        .update({ first_login: false })
        .eq('id', user?.id);

      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      // Limpar campos
      setPasswordData({ newPassword: '', confirmPassword: '' });

    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo e tamanho do arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro no upload",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "Erro no upload",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Processar a imagem para garantir proporções adequadas
      const processedFile = await processImageFile(file);
      
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Fazer upload do arquivo processado
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública da imagem
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar metadados do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: data.publicUrl,
        }
      });

      if (updateError) throw updateError;

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

    } catch (error: any) {
      console.error('Erro no upload do avatar:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer o upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  // Função para processar a imagem e manter proporções
  const processImageFile = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Definir tamanho quadrado (400x400 para boa qualidade)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        if (ctx) {
          // Calcular dimensões para crop centralizado
          const scale = Math.max(size / img.width, size / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Centralizar a imagem
          const x = (size - scaledWidth) / 2;
          const y = (size - scaledHeight) / 2;
          
          // Preencher fundo branco
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          
          // Desenhar imagem redimensionada e centralizada
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        }

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
        }
      });

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const passwordErrors = validatePassword(passwordData.newPassword);
  const isPasswordValid = passwordErrors.length === 0;
  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage 
              src={user?.user_metadata?.avatar_url} 
              className="object-cover"
            />
            <AvatarFallback className="bg-[#3B82F6] text-white text-2xl">
              {getInitials(user?.user_metadata?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <label
              htmlFor="avatar-upload"
              className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white hover:bg-[#2563EB] transition-colors cursor-pointer"
            >
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Configurações do Perfil</h2>
          <p className="text-[#CCCCCC]">Gerencie suas informações pessoais e configurações</p>
        </div>
      </div>

      <Separator className="bg-[#4B5563]" />

      {/* Informações Pessoais */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Atualize suas informações básicas do perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white">Nome Completo</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Digite seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <div className="relative">
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-[#2A2A2A] border-[#4B5563] text-[#CCCCCC] opacity-75"
              />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CCCCCC]" />
            </div>
            <p className="text-xs text-[#CCCCCC]">
              O email não pode ser alterado. Entre em contato com o suporte se necessário.
            </p>
          </div>
          <Button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Segurança
          </CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Altere sua senha para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.newPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Digite sua nova senha"
                className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-gray-400 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswords({ ...showPasswords, newPassword: !showPasswords.newPassword })}
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
              >
                {showPasswords.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirme sua nova senha"
                className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-gray-400 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
              >
                {showPasswords.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          {/* Validações de senha */}
          {passwordData.newPassword && (
            <div className="space-y-2">
              <Label className="text-white text-sm">Requisitos da senha:</Label>
              <div className="space-y-1">
                {[
                  { check: passwordData.newPassword.length >= 8, text: 'Pelo menos 8 caracteres' },
                  { check: /[A-Z]/.test(passwordData.newPassword), text: 'Pelo menos 1 letra maiúscula' },
                  { check: /[a-z]/.test(passwordData.newPassword), text: 'Pelo menos 1 letra minúscula' },
                  { check: /[0-9]/.test(passwordData.newPassword), text: 'Pelo menos 1 número' },
                  { check: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword), text: 'Pelo menos 1 símbolo' },
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
          {passwordData.confirmPassword && !passwordsMatch && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>As senhas não coincidem</span>
            </div>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !isPasswordValid || !passwordsMatch || !passwordData.newPassword}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            <Lock className="w-4 h-4 mr-2" />
            {changingPassword ? 'Alterando senha...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Detalhes sobre sua conta e assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#CCCCCC] text-sm">Status da Conta</Label>
              <p className="text-white font-medium">Ativo</p>
            </div>
            <div>
              <Label className="text-[#CCCCCC] text-sm">Plano Atual</Label>
              <p className="text-white font-medium">Gratuito</p>
            </div>
            <div>
              <Label className="text-[#CCCCCC] text-sm">Membro desde</Label>
              <p className="text-white font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-[#CCCCCC] text-sm">Último acesso</Label>
              <p className="text-white font-medium">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[#4B5563]" />

      {/* Ações da Conta */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Ações da Conta</h3>
        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
};
