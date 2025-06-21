
import { supabase } from '@/integrations/supabase/client';
import { authService } from './authService';

export interface SecurityLog {
  action: string;
  resource: string;
  userId: string;
  timestamp: Date;
  metadata?: any;
}

class SecurityService {
  private logs: SecurityLog[] = [];
  private maxLogsInMemory = 100; // Limitar logs em memória

  // Limpar logs antigos automaticamente
  private cleanupOldLogs(): void {
    const oneHourAgo = Date.now() - 3600000; // 1 hora
    this.logs = this.logs.filter(log => log.timestamp.getTime() > oneHourAgo);
    
    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }
  }

  async logAction(action: string, resource: string, metadata?: any): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const log: SecurityLog = {
      action,
      resource,
      userId: user.id,
      timestamp: new Date(),
      metadata
    };

    this.logs.push(log);
    this.cleanupOldLogs(); // Limpeza automática
    
    console.log('🔐 SecurityService: Ação registrada:', {
      action,
      resource,
      userId: user.id,
      metadata
    });

    // Em produção, salvar no banco de dados via Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await supabase.functions.invoke('security-logs', {
        body: {
          action,
          resource,
          metadata: metadata || {}
        }
      });

      if (response.error) {
        console.warn('⚠️ SecurityService: Falha ao salvar log (não crítico):', response.error);
      }
    } catch (error) {
      console.warn('⚠️ SecurityService: Falha ao salvar log (não crítico):', error);
    }
  }

  async validateResourceAccess(resourceType: string, resourceId: string, action: string): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
      await this.logAction('ACCESS_DENIED', `${resourceType}:${resourceId}`, { 
        reason: 'Usuário não autenticado',
        action
      });
      return false;
    }

    // Para produtos, verificar propriedade
    if (resourceType === 'product') {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('user_id')
          .eq('id', resourceId)
          .single();

        if (error || !data) {
          await this.logAction('ACCESS_DENIED', `${resourceType}:${resourceId}`, { 
            reason: 'Recurso não encontrado',
            action,
            error: error?.message
          });
          return false;
        }

        if (data.user_id !== user.id) {
          const isAdmin = await authService.isUserAdmin();
          if (!isAdmin) {
            await this.logAction('ACCESS_DENIED', `${resourceType}:${resourceId}`, { 
              reason: 'Usuário não é proprietário nem admin',
              action,
              resourceOwner: data.user_id
            });
            return false;
          }
        }

        await this.logAction('ACCESS_GRANTED', `${resourceType}:${resourceId}`, { action });
        return true;
      } catch (error) {
        await this.logAction('ACCESS_ERROR', `${resourceType}:${resourceId}`, { 
          reason: 'Erro na validação',
          action,
          error: error.message
        });
        return false;
      }
    }

    return true;
  }

  async checkRateLimit(action: string, maxRequests: number = 60, windowMs: number = 60000): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) return false;

    // Verificar se é admin - admins têm limites maiores
    const isAdmin = await authService.isUserAdmin();
    if (isAdmin) {
      maxRequests = maxRequests * 5; // Admins têm 5x mais limite
      console.log('👑 Admin detectado - Rate limit aumentado para:', maxRequests);
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filtrar logs recentes para esta ação
    const recentLogs = this.logs.filter(log => 
      log.userId === user.id &&
      log.action === action &&
      log.timestamp.getTime() > windowStart
    );

    console.log(`🔍 Rate limit check: ${action} - ${recentLogs.length}/${maxRequests} requests`, {
      userId: user.id,
      isAdmin,
      windowMs: windowMs / 1000 + 's'
    });

    if (recentLogs.length >= maxRequests) {
      await this.logAction('RATE_LIMIT_EXCEEDED', action, {
        requestCount: recentLogs.length,
        maxRequests,
        windowMs,
        isAdmin
      });
      
      console.warn(`⏱️ Rate limit excedido: ${action} - ${recentLogs.length}/${maxRequests} requests`);
      return false;
    }

    return true;
  }

  getSecurityLogs(limit: number = 100): SecurityLog[] {
    this.cleanupOldLogs();
    return this.logs.slice(-limit);
  }

  async auditUserActivity(userId: string): Promise<SecurityLog[]> {
    this.cleanupOldLogs();
    return this.logs.filter(log => log.userId === userId);
  }
}

export const securityService = new SecurityService();
