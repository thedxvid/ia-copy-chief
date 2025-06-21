
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TokenEditor } from './TokenEditor';
import { TokenAuditHistory } from './TokenAuditHistory';

interface UserTokenData {
  id: string;
  full_name: string | null;
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_tokens_used: number;
}

export const UserTokenManagement: React.FC = () => {
  const [users, setUsers] = useState<UserTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('🔄 UserTokenManagement: Iniciando busca de usuários...');
      
      // Buscar todos os usuários usando a função RPC corrigida
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, monthly_tokens, extra_tokens, total_tokens_used')
        .order('full_name', { ascending: true });

      if (profilesError) {
        console.error('❌ UserTokenManagement: Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('⚠️ UserTokenManagement: Nenhum usuário encontrado');
        setUsers([]);
        return;
      }

      console.log('👥 UserTokenManagement: Profiles encontrados:', profilesData.length);

      // Para cada usuário, usar a função RPC corrigida para obter o cálculo correto
      const usersWithCorrectTokens: UserTokenData[] = [];
      
      for (const profile of profilesData) {
        try {
          console.log(`🔍 UserTokenManagement: Buscando tokens para usuário ${profile.id.slice(0, 8)}...`);
          
          const { data: tokenData, error: tokenError } = await supabase
            .rpc('check_token_balance', { p_user_id: profile.id });

          if (tokenError) {
            console.warn(`⚠️ UserTokenManagement: Erro RPC para usuário ${profile.id.slice(0, 8)}:`, tokenError);
            
            // Fallback para cálculo manual se RPC falhar
            const totalAvailable = Math.max(0, 
              (profile.monthly_tokens || 0) + (profile.extra_tokens || 0) - (profile.total_tokens_used || 0)
            );
            
            usersWithCorrectTokens.push({
              ...profile,
              total_available: totalAvailable
            });
          } else if (tokenData && tokenData.length > 0) {
            console.log(`✅ UserTokenManagement: RPC sucesso para ${profile.id.slice(0, 8)}:`, {
              totalAvailable: tokenData[0].total_available,
              monthlyTokens: tokenData[0].monthly_tokens,
              extraTokens: tokenData[0].extra_tokens,
              totalUsed: tokenData[0].total_used
            });
            
            usersWithCorrectTokens.push({
              id: profile.id,
              full_name: profile.full_name,
              monthly_tokens: tokenData[0].monthly_tokens,
              extra_tokens: tokenData[0].extra_tokens,
              total_available: tokenData[0].total_available,
              total_tokens_used: tokenData[0].total_used
            });
          }
        } catch (userError) {
          console.warn(`⚠️ UserTokenManagement: Erro ao processar usuário ${profile.id.slice(0, 8)}:`, userError);
          
          // Fallback para cálculo manual
          const totalAvailable = Math.max(0, 
            (profile.monthly_tokens || 0) + (profile.extra_tokens || 0) - (profile.total_tokens_used || 0)
          );
          
          usersWithCorrectTokens.push({
            ...profile,
            total_available: totalAvailable
          });
        }
      }

      console.log('✅ UserTokenManagement: Dados processados:', {
        totalUsers: usersWithCorrectTokens.length,
        sampledUser: usersWithCorrectTokens[0] ? {
          name: usersWithCorrectTokens[0].full_name,
          totalAvailable: usersWithCorrectTokens[0].total_available,
          monthlyTokens: usersWithCorrectTokens[0].monthly_tokens,
          extraTokens: usersWithCorrectTokens[0].extra_tokens,
          totalUsed: usersWithCorrectTokens[0].total_tokens_used
        } : 'Nenhum usuário'
      });

      setUsers(usersWithCorrectTokens);
    } catch (error) {
      console.error('❌ UserTokenManagement: Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    console.log('🔄 UserTokenManagement: Configurando subscription...');
    
    const channel = supabase
      .channel('user-token-management-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('🔄 UserTokenManagement: Profile atualizado:', {
            userId: payload.new?.id?.slice(0, 8),
            oldTokens: payload.old?.total_tokens_used,
            newTokens: payload.new?.total_tokens_used
          });
          
          // Atualizar dados quando perfil é modificado
          fetchUsers();
        }
      )
      .subscribe((status) => {
        console.log('📡 UserTokenManagement: Status da subscription:', status);
      });

    return () => {
      console.log('🧹 UserTokenManagement: Limpando subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = users.filter(user => {
    const name = user.full_name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (user: UserTokenData) => {
    if (user.total_available === 0) {
      return <Badge variant="destructive">Sem Créditos</Badge>;
    } else if (user.total_available <= 5000) {
      return <Badge variant="secondary">Poucos Créditos</Badge>;
    } else {
      return <Badge variant="default">Ativo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gerenciamento de Tokens
              </CardTitle>
              <CardDescription>
                Edite tokens de usuários e visualize histórico de alterações
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <TokenAuditHistory />
              <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tokens Mensais</TableHead>
                    <TableHead>Tokens Extras</TableHead>
                    <TableHead>Total Disponível</TableHead>
                    <TableHead>Total Usado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Carregando usuários...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {user.full_name || 'Usuário sem nome'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {user.monthly_tokens?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {user.extra_tokens?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-medium">
                            {user.total_available.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {user.total_tokens_used?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <TokenEditor
                              user={user}
                              onTokensUpdated={fetchUsers}
                            />
                            <TokenAuditHistory
                              userId={user.id}
                              userName={user.full_name || 'Usuário'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
