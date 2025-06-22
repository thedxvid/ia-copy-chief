
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Mail, Shield, CreditCard } from 'lucide-react';

export const UserAdder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    subscriptionStatus: 'active',
    monthlyTokens: 100000,
    extraTokens: 0,
    isAdmin: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Primeiro, tentar criar o usuário via função edge
      const { data: activationData, error: activationError } = await supabase.functions.invoke('activate-user', {
        body: {
          email: formData.email,
          full_name: formData.fullName,
          subscription_status: formData.subscriptionStatus,
          monthly_tokens: formData.monthlyTokens,
          extra_tokens: formData.extraTokens,
          is_admin: formData.isAdmin
        }
      });

      if (activationError) {
        console.error('Erro na ativação:', activationError);
        throw new Error(activationError.message || 'Erro ao ativar usuário');
      }

      console.log('Usuário ativado:', activationData);

      toast.success('Usuário adicionado com sucesso!', {
        description: `${formData.fullName} foi adicionado ao sistema com ${formData.monthlyTokens.toLocaleString()} tokens mensais.`
      });

      // Limpar formulário
      setFormData({
        email: '',
        fullName: '',
        subscriptionStatus: 'active',
        monthlyTokens: 100000,
        extraTokens: 0,
        isAdmin: false
      });

    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro ao adicionar usuário', {
        description: error.message || 'Verifique os dados e tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Adicionar Usuário</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Criar Novo Usuário
          </CardTitle>
          <CardDescription>
            Adicione um novo usuário ao sistema com configurações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nome do usuário"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionStatus">Status da Assinatura</Label>
                <Select
                  value={formData.subscriptionStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissões
                </Label>
                <Select
                  value={formData.isAdmin ? 'admin' : 'user'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isAdmin: value === 'admin' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário Normal</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyTokens" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tokens Mensais
                </Label>
                <Input
                  id="monthlyTokens"
                  type="number"
                  value={formData.monthlyTokens}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyTokens: parseInt(e.target.value) || 0 }))}
                  min="0"
                  step="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="extraTokens">Tokens Extras</Label>
                <Input
                  id="extraTokens"
                  type="number"
                  value={formData.extraTokens}
                  onChange={(e) => setFormData(prev => ({ ...prev, extraTokens: parseInt(e.target.value) || 0 }))}
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.email || !formData.fullName}
                className="w-full md:w-auto"
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Usuário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• O usuário receberá um email com as credenciais de acesso</p>
          <p>• Tokens mensais são renovados automaticamente todo mês</p>
          <p>• Tokens extras nunca expiram e são consumidos após os mensais</p>
          <p>• Administradores têm acesso total ao sistema</p>
        </CardContent>
      </Card>
    </div>
  );
};
