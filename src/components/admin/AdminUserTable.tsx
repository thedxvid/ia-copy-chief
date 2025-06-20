
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTokenMonitoring } from '@/hooks/useTokenMonitoring';
import { Search, Users, UserCheck, AlertTriangle, Download, RefreshCw } from 'lucide-react';

export const AdminUserTable: React.FC = () => {
  const { userDetails, stats, loading, refreshData, exportTokenReport } = useTokenMonitoring();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low' | 'out'>('all');

  const filteredUsers = useMemo(() => {
    let filtered = userDetails.filter(user => {
      const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           user.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = user.total_available > 5000;
      if (statusFilter === 'low') matchesStatus = user.total_available <= 5000 && user.total_available > 0;
      if (statusFilter === 'out') matchesStatus = user.total_available === 0;
      
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => b.usage_percentage - a.usage_percentage);
  }, [userDetails, searchTerm, statusFilter]);

  const getStatusBadge = (user: any) => {
    if (user.total_available === 0) return <Badge variant="destructive">Sem Créditos</Badge>;
    if (user.total_available <= 5000) return <Badge variant="secondary">Poucos Créditos</Badge>;
    return <Badge variant="default">Ativo</Badge>;
  };

  if (loading) {
    return (
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-white">Carregando usuários...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-[#CCCCCC]">Total</p>
                <p className="text-lg font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs text-[#CCCCCC]">Ativos</p>
                <p className="text-lg font-bold text-white">
                  {userDetails.filter(u => u.total_available > 5000).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-xs text-[#CCCCCC]">Baixos</p>
                <p className="text-lg font-bold text-white">{stats?.usersLowTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-xs text-[#CCCCCC]">Sem Créditos</p>
                <p className="text-lg font-bold text-white">{stats?.usersOutOfTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Lista de Usuários ({filteredUsers.length})</span>
            <div className="flex gap-2">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
              <Button
                onClick={exportTokenReport}
                variant="outline"
                size="sm"
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CCCCCC]" />
              <Input
                placeholder="Buscar por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#2A2A2A] border-[#4B5563] text-white"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'low', 'out'].map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter as any)}
                  className={
                    statusFilter === filter
                      ? 'bg-[#3B82F6] text-white'
                      : 'border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]'
                  }
                >
                  {filter === 'all' && 'Todos'}
                  {filter === 'active' && 'Ativos'}
                  {filter === 'low' && 'Baixos'}
                  {filter === 'out' && 'Sem Créditos'}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#4B5563] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#4B5563] hover:bg-[#2A2A2A]">
                  <TableHead className="text-[#CCCCCC]">Usuário</TableHead>
                  <TableHead className="text-[#CCCCCC]">Status</TableHead>
                  <TableHead className="text-[#CCCCCC]">Créditos</TableHead>
                  <TableHead className="text-[#CCCCCC]">Uso</TableHead>
                  <TableHead className="text-[#CCCCCC]">Total Usado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.slice(0, 50).map((user) => (
                  <TableRow key={user.id} className="border-[#4B5563] hover:bg-[#2A2A2A]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">
                          {user.full_name || 'Sem nome'}
                        </p>
                        <p className="text-xs text-[#CCCCCC]">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-white font-mono text-sm">
                          {user.total_available.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#CCCCCC]">
                          M: {user.monthly_tokens.toLocaleString()} | 
                          E: {user.extra_tokens.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(100, user.usage_percentage)}
                            className="w-16 h-2"
                          />
                          <span className="text-xs text-white font-mono">
                            {user.usage_percentage}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-white font-mono text-sm">
                        {user.total_tokens_used.toLocaleString()}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-[#4B5563] mx-auto mb-4" />
              <p className="text-[#CCCCCC]">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum usuário encontrado com os filtros aplicados'
                  : 'Nenhum usuário encontrado'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
