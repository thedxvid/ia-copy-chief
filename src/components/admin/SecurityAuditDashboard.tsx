
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, User, Activity, RefreshCw } from 'lucide-react';
import { securityService } from '@/services/securityService';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  metadata: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const SecurityAuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    error: 0,
    info: 0
  });

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const auditLogs = await securityService.getAuditLogs(200);
      setLogs(auditLogs);
      
      // Calcular estatísticas
      const newStats = auditLogs.reduce((acc, log) => {
        acc.total++;
        acc[log.severity]++;
        return acc;
      }, { total: 0, critical: 0, warning: 0, error: 0, info: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldLogs = async () => {
    try {
      await securityService.cleanupOldAuditLogs();
      toast.success('Limpeza de logs antigos executada com sucesso');
      loadAuditLogs(); // Recarregar logs após limpeza
    } catch (error) {
      console.error('Erro na limpeza de logs:', error);
      toast.error('Erro ao executar limpeza de logs');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-red-400';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const truncateString = (str: string, length: number = 50) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Auditoria de Segurança</h2>
        <div className="flex gap-2">
          <Button onClick={cleanupOldLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Logs Antigos
          </Button>
          <Button onClick={loadAuditLogs} disabled={loading}>
            <Activity className="h-4 w-4 mr-2" />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Críticos</p>
                <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-medium">Erros</p>
                <p className="text-2xl font-bold text-red-400">{stats.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Avisos</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.warning}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Info</p>
                <p className="text-2xl font-bold text-blue-500">{stats.info}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getSeverityColor(log.severity)} text-white`}>
                      {getSeverityIcon(log.severity)}
                      <span className="ml-1 text-xs">{log.severity.toUpperCase()}</span>
                    </Badge>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <strong>Recurso:</strong> {log.resource}
                </div>

                {log.user_id && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Usuário: {log.user_id}</span>
                  </div>
                )}

                {log.ip_address && (
                  <div className="text-sm text-gray-600">
                    <strong>IP:</strong> {log.ip_address}
                  </div>
                )}

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Ver Metadados
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}

                {log.user_agent && (
                  <div className="text-xs text-gray-500">
                    <strong>User Agent:</strong> {truncateString(log.user_agent, 80)}
                  </div>
                )}
              </div>
            ))}

            {logs.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log de auditoria disponível</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
                <p>Carregando logs de auditoria...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
