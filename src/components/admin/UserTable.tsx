
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTokenMonitoring } from '@/hooks/useTokenMonitoring';
import { TokenEditor } from '@/components/admin/TokenEditor';
import { TokenAuditHistory } from '@/components/admin/TokenAuditHistory';
import { Search, Users, UserCheck, AlertTriangle, Download, RefreshCw, Settings } from 'lucide-react';

export const UserTable: React.FC = () => {
  const { userDetails, stats, loading, refreshData, exportTokenReport } = useTokenMonitoring();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    let filtered = userDetails.filter(user => {
      const matchesSearch = (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           user.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = user.total_available > 5000;
      if (statusFilter === 'low') matchesStatus = user.total_available <= 5000 && user.total_available > 0;
      if (statusFilter === 'out') matchesStatus = user.total_available === 0;
      
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => b.usage_percentage - a.usage_percentage);
  }, [userDetails, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (user: any) => {
    if (user.total_available === 0) return <Badge variant="destructive">Sem Créditos</Badge>;
    if (user.total_available <= 5000) return <Badge variant="secondary">Poucos Créditos</Badge>;
    return <Badge variant="default">Ativo</Badge>;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
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
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-[#CCCCCC]">Total de Usuários</p>
                <p className="text-xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-[#CCCCCC]">Usuários Ativos</p>
                <p className="text-xl font-bold text-white">
                  {userDetails.filter(u => u.total_available > 5000).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-[#CCCCCC]">Poucos Créditos</p>
                <p className="text-xl font-bold text-white">{stats?.usersLowTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-[#CCCCCC]">Sem Créditos</p>
                <p className="text-xl font-bold text-white">{stats?.usersOutOfTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista de Usuários ({filteredUsers.length})
            </span>
            <div className="flex gap-2">
              <TokenAuditHistory />
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={exportTokenReport}
                variant="outline"
                size="sm"
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Gerencie e monitore todos os usuários ativos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CCCCCC]" />
              <Input
                placeholder="Buscar por email, nome ou ID..."
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
                  {filter === 'low' && 'Poucos Créditos'}
                  {filter === 'out' && 'Sem Créditos'}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border border-[#4B5563] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#4B5563] hover:bg-[#2A2A2A]">
                  <TableHead className="text-[#CCCCCC]">Email</TableHead>
                  <TableHead className="text-[#CCCCCC]">Status</TableHead>
                  <TableHead className="text-[#CCCCCC]">Créditos</TableHead>
                  <TableHead className="text-[#CCCCCC]">Uso</TableHead>
                  <TableHead className="text-[#CCCCCC]">Data Reset</TableHead>
                  <TableHead className="text-[#CCCCCC]">Total Usado</TableHead>
                  <TableHead className="text-[#CCCCCC]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="border-[#4B5563] hover:bg-[#2A2A2A]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">
                          {user.email || 'Email não disponível'}
                        </p>
                        <p className="text-sm text-[#CCCCCC]">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-white font-mono">
                          {user.total_available.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#CCCCCC]">
                          Mensal: {user.monthly_tokens.toLocaleString()} | 
                          Extra: {user.extra_tokens.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(100, user.usage_percentage)}
                            className="w-16"
                          />
                          <span className="text-sm text-white font-mono">
                            {user.usage_percentage}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-[#CCCCCC]">
                        {new Date(user.tokens_reset_date).toLocaleDateString('pt-BR')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-white font-mono">
                        {user.total_tokens_used.toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TokenEditor
                          user={{
                            id: user.id,
                            full_name: user.full_name,
                            monthly_tokens: user.monthly_tokens,
                            extra_tokens: user.extra_tokens,
                            total_available: user.total_available
                          }}
                          onTokensUpdated={refreshData}
                        />
                        <TokenAuditHistory
                          userId={user.id}
                          userName={user.email || user.full_name || 'Usuário'}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

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
