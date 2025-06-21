
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Plus, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
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
    if (!actionType || !value) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('O valor deve ser um número positivo');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_user_tokens', {
        p_target_user_id: user.id,
        p_action_type: actionType,
        p_value: numValue,
        p_reason: reason || null
      });

      if (error) throw error;

      if (data) {
        toast.success('Tokens atualizados com sucesso!');
        setIsOpen(false);
        setActionType('');
        setValue('');
        setReason('');
        onTokensUpdated();
      }
    } catch (error) {
      console.error('Erro ao atualizar tokens:', error);
      toast.error('Erro ao atualizar tokens. Verifique suas permissões.');
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
        return '';
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
          <DialogDescription>
            Edite os tokens de {user.full_name || 'Usuário'}
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
              <Label htmlFor="action">Ação</Label>
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
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="Digite o valor"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min="0"
                />
              </div>
            )}

            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da alteração..."
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
                  {actionType !== 'reset_monthly' && value && ` (${parseInt(value || '0').toLocaleString()} tokens)`}
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
              {isLoading ? 'Atualizando...' : 'Atualizar Tokens'}
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
