
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, monthly_tokens, extra_tokens, total_tokens_used')
        .order('full_name', { ascending: true });

      if (error) throw error;

      const usersWithCalculatedTokens = data.map(user => ({
        ...user,
        total_available: (user.monthly_tokens || 0) + (user.extra_tokens || 0)
      }));

      setUsers(usersWithCalculatedTokens);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
