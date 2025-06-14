
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, LogOut, Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-[#3B82F6] text-white text-2xl">
              {getInitials(user?.user_metadata?.full_name)}
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white hover:bg-[#2563EB] transition-colors">
            <Camera className="w-4 h-4" />
          </button>
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
