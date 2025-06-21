
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Calendar, FileText, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string;
  admin_user_id: string;
  action_type: string;
  old_value: number;
  new_value: number;
  reason: string | null;
  created_at: string;
  admin_name?: string;
  user_name?: string;
}

interface TokenAuditHistoryProps {
  userId?: string;
  userName?: string;
}

export const TokenAuditHistory: React.FC<TokenAuditHistoryProps> = ({ userId, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('token_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos usuários
      const userIds = Array.from(new Set([
        ...data.map(log => log.user_id),
        ...data.map(log => log.admin_user_id)
      ]));

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile.full_name || 'Usuário sem nome';
        return acc;
      }, {} as Record<string, string>);

      const enrichedLogs = data.map(log => ({
        ...log,
        user_name: profilesMap[log.user_id],
        admin_name: profilesMap[log.admin_user_id]
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico de auditoria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen, userId]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'add_monthly':
      case 'add_extra':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'set_monthly':
      case 'set_extra':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'reset_monthly':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'add_monthly':
        return 'Adicionou Tokens Mensais';
      case 'add_extra':
        return 'Adicionou Tokens Extras';
      case 'set_monthly':
        return 'Definiu Tokens Mensais';
      case 'set_extra':
        return 'Definiu Tokens Extras';
      case 'reset_monthly':
        return 'Resetou Tokens Mensais';
      default:
        return actionType;
    }
  };

  const getValueChange = (log: AuditLog) => {
    const diff = log.new_value - log.old_value;
    if (diff > 0) {
      return (
        <Badge variant="secondary" className="text-green-600">
          +{diff.toLocaleString()}
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge variant="secondary" className="text-red-600">
          {diff.toLocaleString()}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          Sem alteração
        </Badge>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          {userId ? 'Histórico' : 'Histórico Geral'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Alterações de Tokens
            {userName && (
              <Badge variant="secondary" className="ml-2">
                {userName}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum histórico de alterações encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <div>
                          <p className="font-medium text-sm">
                            {getActionLabel(log.action_type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {getValueChange(log)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Usuário:</span>
                        <span>{log.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Admin:</span>
                        <span>{log.admin_name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor anterior:</span>
                        <span className="ml-2 font-mono">{log.old_value.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Novo valor:</span>
                        <span className="ml-2 font-mono">{log.new_value.toLocaleString()}</span>
                      </div>
                    </div>

                    {log.reason && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <span className="text-muted-foreground">Motivo:</span>
                        <p className="mt-1">{log.reason}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
