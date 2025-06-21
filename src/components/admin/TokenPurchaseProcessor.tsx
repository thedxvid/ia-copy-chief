
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coins, CreditCard, RefreshCw, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PendingPurchase {
  id: string;
  user_id: string;
  digital_guru_order_id: string | null;
  tokens_purchased: number;
  amount_paid: number;
  payment_status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    extra_tokens: number;
  } | null;
}

export const TokenPurchaseProcessor: React.FC = () => {
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showManualCredit, setShowManualCredit] = useState(false);
  
  // Estados para crédito manual
  const [manualUserId, setManualUserId] = useState('');
  const [manualTokens, setManualTokens] = useState('');
  const [manualReason, setManualReason] = useState('');

  const fetchPendingPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('token_package_purchases')
        .select(`
          id,
          user_id,
          digital_guru_order_id,
          tokens_purchased,
          amount_paid,
          payment_status,
          created_at,
          profiles!inner (
            full_name,
            extra_tokens
          )
        `)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar apenas resultados válidos e transformar para o tipo esperado
      const validPurchases: PendingPurchase[] = (data || []).map(purchase => ({
        ...purchase,
        profiles: purchase.profiles ? {
          full_name: purchase.profiles.full_name,
          extra_tokens: purchase.profiles.extra_tokens
        } : null
      }));
      
      setPendingPurchases(validPurchases);
    } catch (error) {
      console.error('Erro ao buscar compras pendentes:', error);
      toast.error('Erro ao carregar compras pendentes');
    } finally {
      setLoading(false);
    }
  };

  const processPurchase = async (purchase: PendingPurchase) => {
    setProcessing(purchase.id);
    
    try {
      console.log('🔄 Processando compra manualmente:', {
        purchaseId: purchase.id,
        userId: purchase.user_id,
        tokens: purchase.tokens_purchased
      });

      // 1. Atualizar tokens do usuário
      const { error: creditError } = await supabase
        .from('profiles')
        .update({
          extra_tokens: (purchase.profiles?.extra_tokens || 0) + purchase.tokens_purchased,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchase.user_id);

      if (creditError) throw creditError;

      // 2. Atualizar status da compra
      const { error: purchaseError } = await supabase
        .from('token_package_purchases')
        .update({
          payment_status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', purchase.id);

      if (purchaseError) throw purchaseError;

      // 3. Registrar no log de auditoria
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase
        .from('token_audit_logs')
        .insert({
          user_id: purchase.user_id,
          admin_user_id: currentUser.user?.id,
          action_type: 'add_extra',
          old_value: purchase.profiles?.extra_tokens || 0,
          new_value: (purchase.profiles?.extra_tokens || 0) + purchase.tokens_purchased,
          reason: `Processamento manual de compra pendente - Purchase ID: ${purchase.id}`
        });

      toast.success('Compra processada com sucesso!', {
        description: `${purchase.tokens_purchased.toLocaleString()} tokens creditados para ${purchase.profiles?.full_name || 'usuário'}`
      });

      // Atualizar a lista
      fetchPendingPurchases();

    } catch (error) {
      console.error('Erro ao processar compra:', error);
      toast.error('Erro ao processar compra', {
        description: 'Verifique os logs para mais detalhes'
      });
    } finally {
      setProcessing(null);
    }
  };

  const creditTokensManually = async () => {
    if (!manualUserId || !manualTokens) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const tokensAmount = parseInt(manualTokens);
    if (isNaN(tokensAmount) || tokensAmount <= 0) {
      toast.error('Quantidade de tokens deve ser um número positivo');
      return;
    }

    try {
      console.log('🔄 Creditando tokens manualmente:', {
        userId: manualUserId,
        tokens: tokensAmount,
        reason: manualReason
      });

      // 1. Buscar usuário atual
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('extra_tokens, full_name')
        .eq('id', manualUserId)
        .single();

      if (!userProfile) {
        toast.error('Usuário não encontrado');
        return;
      }

      // 2. Creditar tokens
      const { error: creditError } = await supabase
        .from('profiles')
        .update({
          extra_tokens: (userProfile.extra_tokens || 0) + tokensAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', manualUserId);

      if (creditError) throw creditError;

      // 3. Criar registro de compra manual
      const { error: purchaseError } = await supabase
        .from('token_package_purchases')
        .insert({
          user_id: manualUserId,
          package_id: '00000000-0000-0000-0000-000000000000', // UUID padrão para créditos manuais
          tokens_purchased: tokensAmount,
          amount_paid: 0,
          payment_status: 'completed',
          processed_at: new Date().toISOString(),
          digital_guru_order_id: `MANUAL_${Date.now()}`
        });

      if (purchaseError) throw purchaseError;

      // 4. Registrar no log de auditoria
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase
        .from('token_audit_logs')
        .insert({
          user_id: manualUserId,
          admin_user_id: currentUser.user?.id,
          action_type: 'add_extra',
          old_value: userProfile.extra_tokens || 0,
          new_value: (userProfile.extra_tokens || 0) + tokensAmount,
          reason: manualReason || 'Crédito manual de tokens'
        });

      toast.success('Tokens creditados manualmente!', {
        description: `${tokensAmount.toLocaleString()} tokens creditados para ${userProfile.full_name || 'usuário'}`
      });

      // Limpar formulário
      setManualUserId('');
      setManualTokens('');
      setManualReason('');
      setShowManualCredit(false);

    } catch (error) {
      console.error('Erro ao creditar tokens manualmente:', error);
      toast.error('Erro ao creditar tokens', {
        description: 'Verifique os logs para mais detalhes'
      });
    }
  };

  React.useEffect(() => {
    fetchPendingPurchases();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Processador de Compras de Tokens</h2>
          <p className="text-muted-foreground">Gerencie compras pendentes e credite tokens manualmente</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPendingPurchases} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={showManualCredit} onOpenChange={setShowManualCredit}>
            <DialogTrigger asChild>
              <Button>
                <Coins className="w-4 h-4 mr-2" />
                Creditar Manualmente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creditar Tokens Manualmente</DialogTitle>
                <DialogDescription>
                  Use esta opção para creditar tokens diretamente para um usuário específico
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userId">ID do Usuário *</Label>
                  <Input
                    id="userId"
                    placeholder="UUID do usuário"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use d037eaf2-e41d-46d2-9bad-4adc987594e6 para o usuário do teste
                  </p>
                </div>
                <div>
                  <Label htmlFor="tokens">Quantidade de Tokens *</Label>
                  <Input
                    id="tokens"
                    type="number"
                    placeholder="Ex: 10000"
                    value={manualTokens}
                    onChange={(e) => setManualTokens(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Motivo</Label>
                  <Input
                    id="reason"
                    placeholder="Ex: Compra não processada automaticamente"
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                  />
                </div>
                <Button onClick={creditTokensManually} className="w-full">
                  <Coins className="w-4 h-4 mr-2" />
                  Creditar Tokens
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : pendingPurchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma compra pendente</h3>
            <p className="text-muted-foreground text-center">
              Todas as compras de tokens foram processadas com sucesso
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingPurchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Compra #{purchase.digital_guru_order_id || purchase.id.slice(0, 8)}
                  </CardTitle>
                  <Badge variant="secondary">Pendente</Badge>
                </div>
                <CardDescription>
                  Criada em {new Date(purchase.created_at).toLocaleString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Usuário</Label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{purchase.profiles?.full_name || 'Nome não disponível'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tokens</Label>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      <span className="text-sm font-semibold">{purchase.tokens_purchased.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Pago</Label>
                    <span className="text-sm">R$ {purchase.amount_paid.toFixed(2)}</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tokens Atuais</Label>
                    <span className="text-sm">{(purchase.profiles?.extra_tokens || 0).toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  onClick={() => processPurchase(purchase)}
                  disabled={processing === purchase.id}
                  className="w-full"
                >
                  {processing === purchase.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Processar Compra
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
