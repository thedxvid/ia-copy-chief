
import { supabase } from '@/integrations/supabase/client';
import { authService } from './authService';

export interface SecurityLog {
  action: string;
  resource: string;
  userId: string;
  timestamp: Date;
  metadata?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  ip_address?: string;
  user_agent?: string;
}

class SecurityService {
  private logs: SecurityLog[] = [];
  private maxLogsInMemory = 50; // Reduzido para usar mais o banco
  private ipAddress?: string;
  private userAgent?: string;

  constructor() {
    // Capturar informações do cliente
    this.userAgent = navigator.userAgent;
    this.getClientIP();
  }

  private async getClientIP(): Promise<void> {
    try {
      // Usar serviço simples para capturar IP
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.ipAddress = data.ip;
    } catch (error) {
      console.warn('⚠️ Não foi possível capturar IP do cliente:', error);
    }
  }

  // Limpar logs antigos automaticamente
  private cleanupOldLogs(): void {
    const halfHourAgo = Date.now() - 1800000; // 30 minutos
    this.logs = this.logs.filter(log => log.timestamp.getTime() > halfHourAgo);
    
    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }
  }

  async logAction(
    action: string, 
    resource: string, 
    metadata?: any, 
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const log: SecurityLog = {
      action,
      resource,
      userId: user.id,
      timestamp: new Date(),
      metadata: metadata || {},
      severity,
      ip_address: this.ipAddress,
      user_agent: this.userAgent
    };

    // Validação de entrada mais rigorosa
    if (!action || typeof action !== 'string' || action.length > 100) {
      console.error('❌ SecurityService: Ação inválida:', action);
      return;
    }

    if (!resource || typeof resource !== 'string' || resource.length > 200) {
      console.error('❌ SecurityService: Recurso inválido:', resource);
      return;
    }

    this.logs.push(log);
    this.cleanupOldLogs();
    
    console.log(`🔐 SecurityService: [${severity.toUpperCase()}] ${action} em ${resource}`, {
      userId: user.id,
      metadata,
      ip: this.ipAddress
    });

    // Salvar no banco de dados persistente
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { error } = await supabase
        .from('security_audit_logs')
        .insert({
          user_id: user.id,
          action,
          resource,
          metadata: metadata || {},
          severity,
          ip_address: this.ipAddress,
          user_agent: this.userAgent
        });

      if (error) {
        console.warn('⚠️ SecurityService: Falha ao salvar log persistente:', error);
        // Fallback para Edge Function se RLS falhar
        await this.fallbackLog(action, resource, metadata);
      }
    } catch (error) {
      console.warn('⚠️ SecurityService: Erro ao salvar log persistente:', error);
      await this.fallbackLog(action, resource, metadata);
    }
  }

  private async fallbackLog(action: string, resource: string, metadata?: any): Promise<void> {
    try {
      const response = await supabase.functions.invoke('security-logs', {
        body: {
          action,
          resource,
          metadata: metadata || {}
        }
      });

      if (response.error) {
        console.warn('⚠️ SecurityService: Fallback também falhou:', response.error);
      }
    } catch (error) {
      console.warn('⚠️ SecurityService: Fallback crítico:', error);
    }
  }

  async validateResourceAccess(resourceType: string, resourceId: string, action: string): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
      await this.logAction('ACCESS_DENIED', `${resourceType}:${resourceId}`, { 
        reason: 'Usuário não autenticado',
        action,
        attempted_resource: resourceType,
        resource_id: resourceId
      }, 'warning');
      return false;
    }

    // Validação de entrada rigorosa
    if (!resourceType || !resourceId || !action) {
      await this.logAction('INVALID_ACCESS_ATTEMPT', `${resourceType}:${resourceId}`, {
        reason: 'Parâmetros inválidos',
        resourceType,
        resourceId,
        action
      }, 'error');
      return false;
    }

    // Para produtos, verificar propriedade com validação dupla
    if (resourceType === 'product') {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('user_id, name')
          .eq('id', resourceId)
          .single();

        if (error || !data) {
          await this.logAction('ACCESS_DENIED', `${resourceType}:${resourceId}`, { 
            reason: 'Recurso não encontrado ou erro na consulta',
            action,
            error: error?.message,
            query_attempted: true
          }, 'warning');
          return false;
        }

        // Verificação dupla: proprietário OU admin
        const isAdmin = await authService.isUserAdmin();
        const isOwner = data.user_id === user.id;

        if (!isOwner && !isAdmin) {
          await this.logAction('ACCESS_DENIED', `${resourceType}:${resourceId}`, { 
            reason: 'Usuário não é proprietário nem admin',
            action,
            resourceOwner: data.user_id,
            productName: data.name,
            userIsAdmin: isAdmin,
            userIsOwner: isOwner
          }, 'warning');
          return false;
        }

        await this.logAction('ACCESS_GRANTED', `${resourceType}:${resourceId}`, { 
          action,
          access_type: isAdmin ? 'admin' : 'owner',
          productName: data.name
        });
        return true;
      } catch (error) {
        await this.logAction('ACCESS_ERROR', `${resourceType}:${resourceId}`, { 
          reason: 'Erro crítico na validação',
          action,
          error: error.message,
          stack: error.stack
        }, 'error');
        return false;
      }
    }

    // Log para outros tipos de recurso
    await this.logAction('ACCESS_GRANTED', `${resourceType}:${resourceId}`, { action });
    return true;
  }

  async checkRateLimit(action: string, maxRequests: number = 30, windowMs: number = 60000): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) return false;

    try {
      // Usar nova função do banco com logs persistentes
      const { data, error } = await supabase.rpc('enhanced_rate_limit_check', {
        p_user_id: user.id,
        p_action: action,
        p_max_requests: maxRequests,
        p_window_minutes: Math.floor(windowMs / 60000)
      });

      if (error) {
        console.error('❌ Erro no rate limit check:', error);
        // Fallback para lógica local em caso de erro
        return this.fallbackRateLimit(action, maxRequests, windowMs, user.id);
      }

      const allowed = data as boolean;
      
      if (!allowed) {
        await this.logAction('RATE_LIMIT_EXCEEDED', action, {
          maxRequests,
          windowMs,
          fallback_used: false
        }, 'warning');
      }

      return allowed;
    } catch (error) {
      console.error('❌ Erro crítico no rate limiting:', error);
      return this.fallbackRateLimit(action, maxRequests, windowMs, user.id);
    }
  }

  private async fallbackRateLimit(action: string, maxRequests: number, windowMs: number, userId: string): Promise<boolean> {
    // Verificar se é admin para limites maiores (fallback local)
    const isAdmin = await authService.isUserAdmin();
    if (isAdmin) {
      maxRequests = maxRequests * 10;
      console.log('👑 Admin detectado (fallback) - Rate limit aumentado para:', maxRequests);
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filtrar logs recentes para esta ação
    const recentLogs = this.logs.filter(log => 
      log.userId === userId &&
      log.action === action &&
      log.timestamp.getTime() > windowStart
    );

    const allowed = recentLogs.length < maxRequests;

    if (!allowed) {
      await this.logAction('RATE_LIMIT_EXCEEDED', action, {
        requestCount: recentLogs.length,
        maxRequests,
        windowMs,
        isAdmin,
        fallback_used: true
      }, 'warning');
    }

    return allowed;
  }

  async detectSuspiciousActivity(userId: string, action: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('detect_suspicious_activity', {
        p_user_id: userId,
        p_action: action,
        p_threshold: 50
      });

      if (error) {
        console.error('❌ Erro na detecção de atividade suspeita:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('❌ Erro crítico na detecção de atividade suspeita:', error);
      return false;
    }
  }

  getSecurityLogs(limit: number = 50): SecurityLog[] {
    this.cleanupOldLogs();
    return this.logs.slice(-limit);
  }

  async auditUserActivity(userId: string): Promise<SecurityLog[]> {
    this.cleanupOldLogs();
    return this.logs.filter(log => log.userId === userId);
  }

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro ao buscar logs de auditoria:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro crítico ao buscar logs de auditoria:', error);
      return [];
    }
  }

  async cleanupOldAuditLogs(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_old_audit_logs');
      
      if (error) {
        console.error('❌ Erro na limpeza de logs antigos:', error);
      } else {
        console.log('✅ Limpeza de logs antigos executada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro crítico na limpeza de logs antigos:', error);
    }
  }
}

export const securityService = new SecurityService();
