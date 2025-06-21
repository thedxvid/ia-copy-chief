
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Plus, Minus, RefreshCw, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TokenEditorProps {
  user: {
    id: string;
    full_name: string | null;
    monthly_tokens: number;
    extra_tokens: number;
    total_available: number;
  };
  onTokensUpdated: () => void;
}

export const TokenEditor: React.FC<TokenEditorProps> = ({ user, onTokensUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const handleUpdateTokens = async () => {
    if (!actionType || (!value && actionType !== 'reset_monthly')) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const numValue = actionType === 'reset_monthly' ? 100000 : parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('O valor deve ser um número positivo');
      return;
    }

    setIsLoading(true);
    
    console.log('🔄 TokenEditor: Iniciando atualização de tokens:', {
      userId: user.id.slice(0, 8),
      userName: user.full_name,
      action: actionType,
      value: numValue,
      reason: reason || 'Não informado'
    });

    try {
      // Verificar se o usuário atual tem permissões de admin
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('👤 TokenEditor: Usuário atual:', currentUser.user?.id?.slice(0, 8));

      // Verificar status de admin do usuário atual
      const { data: adminProfile, error: adminCheckError } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', currentUser.user?.id)
        .single();

      if (adminCheckError) {
        console.error('❌ TokenEditor: Erro ao verificar admin:', adminCheckError);
        throw new Error('Erro ao verificar permissões de administrador');
      }

      console.log('🔐 TokenEditor: Status admin:', {
        isAdmin: adminProfile?.is_admin,
        adminName: adminProfile?.full_name
      });

      if (!adminProfile?.is_admin) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissões de administrador. Contate um admin para obter as permissões necessárias.',
          duration: 8000,
        });
        return;
      }

      // Chamar a função RPC
      const { data, error } = await supabase.rpc('admin_update_user_tokens', {
        p_target_user_id: user.id,
        p_action_type: actionType,
        p_value: numValue,
        p_reason: reason || null
      });

      console.log('📡 TokenEditor: Resposta da RPC:', { data, error });

      if (error) {
        console.error('❌ TokenEditor: Erro na RPC:', error);
        
        // Tratamento de erros mais específico
        let errorMessage = 'Erro desconhecido ao atualizar tokens';
        let errorDescription = 'Verifique os logs do console para mais detalhes.';

        if (error.message) {
          if (error.message.includes('Admin privileges required')) {
            errorMessage = 'Permissões insuficientes';
            errorDescription = 'Você não tem permissões de administrador para esta operação.';
          } else if (error.message.includes('User not found') || error.message.includes('Target user not found')) {
            errorMessage = 'Usuário não encontrado';
            errorDescription = 'O usuário selecionado não existe no sistema.';
          } else if (error.message.includes('Invalid action type')) {
            errorMessage = 'Ação inválida';
            errorDescription = 'O tipo de ação selecionado não é válido.';
          } else if (error.message.includes('Token value cannot be negative')) {
            errorMessage = 'Valor inválido';
            errorDescription = 'O valor dos tokens deve ser um número positivo.';
          } else {
            errorMessage = 'Erro na operação';
            errorDescription = error.message;
          }
        }

        toast.error(errorMessage, {
          description: errorDescription,
          duration: 8000,
        });
        return;
      }

      // Se chegou aqui, a operação foi bem-sucedida
      console.log('✅ TokenEditor: Tokens atualizados com sucesso');
      
      toast.success('Tokens atualizados com sucesso!', {
        description: `${getActionDescription(actionType)} - ${numValue.toLocaleString()} tokens para ${user.full_name}`,
        duration: 5000,
      });
      
      setIsOpen(false);
      setActionType('');
      setValue('');
      setReason('');
      
      // Aguardar um pouco antes de atualizar para garantir que o banco foi atualizado
      setTimeout(() => {
        console.log('🔄 TokenEditor: Chamando onTokensUpdated...');
        onTokensUpdated();
      }, 500);

    } catch (error) {
      console.error('❌ TokenEditor: Erro geral:', error);
      
      toast.error('Erro interno do sistema', {
        description: error instanceof Error ? error.message : 'Erro desconhecido. Tente novamente ou contate o suporte.',
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'add_monthly':
        return 'Adicionar tokens mensais';
      case 'add_extra':
        return 'Adicionar tokens extras';
      case 'set_monthly':
        return 'Definir tokens mensais';
      case 'set_extra':
        return 'Definir tokens extras';
      case 'reset_monthly':
        return 'Resetar tokens mensais (100.000)';
      default:
        return 'Ação desconhecida';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Coins className="w-4 h-4" />
          Editar Tokens
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Editar Tokens do Usuário
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Editando tokens de: <strong>{user.full_name || 'Usuário sem nome'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status atual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tokens Mensais:</span>
                <Badge variant="secondary">{user.monthly_tokens.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tokens Extras:</span>
                <Badge variant="secondary">{user.extra_tokens.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Disponível:</span>
                <Badge variant="default">{user.total_available.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de edição */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="action">Ação *</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add_monthly">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Tokens Mensais
                    </div>
                  </SelectItem>
                  <SelectItem value="add_extra">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Tokens Extras
                    </div>
                  </SelectItem>
                  <SelectItem value="set_monthly">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Definir Tokens Mensais
                    </div>
                  </SelectItem>
                  <SelectItem value="set_extra">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Definir Tokens Extras
                    </div>
                  </SelectItem>
                  <SelectItem value="reset_monthly">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Resetar Tokens Mensais
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType && actionType !== 'reset_monthly' && (
              <div>
                <Label htmlFor="value">Valor *</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="Digite o valor"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sugestão: Use múltiplos de 1.000 tokens
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da alteração (ex: Compra de pacote extra, Ajuste de sistema, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {actionType && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Ação selecionada:</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getActionDescription(actionType)}
                  {actionType !== 'reset_monthly' && value && ` - ${parseInt(value || '0').toLocaleString()} tokens`}
                  {actionType === 'reset_monthly' && ' - 100.000 tokens'}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpdateTokens}
              disabled={isLoading || !actionType || (actionType !== 'reset_monthly' && !value)}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Atualizando...
                </div>
              ) : (
                'Atualizar Tokens'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
