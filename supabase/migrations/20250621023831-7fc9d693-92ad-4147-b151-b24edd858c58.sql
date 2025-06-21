
-- 1. Corrigir função notify_token_change com search_path adequado
CREATE OR REPLACE FUNCTION public.notify_token_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Notificar mudança via NOTIFY
  PERFORM pg_notify(
    'token_update',
    json_build_object(
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Criar triggers que estavam faltando
DROP TRIGGER IF EXISTS token_usage_notify ON public.token_usage;
CREATE TRIGGER token_usage_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_change();

DROP TRIGGER IF EXISTS profiles_token_notify ON public.profiles;
CREATE TRIGGER profiles_token_notify
  AFTER UPDATE OF monthly_tokens, extra_tokens, total_tokens_used ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_change();

-- 3. Criar tabela para logs de segurança persistentes
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Criar índices para performance dos logs
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON public.security_audit_logs(severity);

-- 5. Ativar RLS na tabela de logs de auditoria
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para logs de auditoria
CREATE POLICY "Users can view their own audit logs" 
  ON public.security_audit_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
  ON public.security_audit_logs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs" 
  ON public.security_audit_logs 
  FOR SELECT 
  USING (public.is_user_admin(auth.uid()));

-- 7. Função para limpeza automática de logs antigos (manter 6 meses)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.security_audit_logs 
  WHERE created_at < (now() - interval '6 months');
  
  DELETE FROM public.security_logs 
  WHERE created_at < (now() - interval '6 months');
END;
$$;

-- 8. Função para detectar atividades suspeitas
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  p_user_id UUID,
  p_action TEXT,
  p_threshold INTEGER DEFAULT 50
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_actions INTEGER;
BEGIN
  -- Contar ações recentes (última hora)
  SELECT COUNT(*) INTO recent_actions
  FROM public.security_audit_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > (now() - interval '1 hour');
  
  -- Se exceder threshold, marcar como suspeito
  IF recent_actions > p_threshold THEN
    INSERT INTO public.security_audit_logs (
      user_id, action, resource, metadata, severity
    ) VALUES (
      p_user_id, 'SUSPICIOUS_ACTIVITY_DETECTED', p_action,
      json_build_object('threshold', p_threshold, 'actual_count', recent_actions),
      'critical'
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 9. Melhorar função de rate limiting com logs persistentes
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INTEGER DEFAULT 30,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_count INTEGER;
  is_admin BOOLEAN;
  actual_limit INTEGER;
BEGIN
  -- Verificar se é admin para limites maiores
  SELECT public.is_user_admin(p_user_id) INTO is_admin;
  
  -- Admins têm 10x mais limite
  actual_limit := CASE WHEN is_admin THEN p_max_requests * 10 ELSE p_max_requests END;
  
  -- Contar requests recentes
  SELECT COUNT(*) INTO request_count
  FROM public.security_audit_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > (now() - (p_window_minutes || ' minutes')::interval);
  
  -- Log da verificação de rate limit
  INSERT INTO public.security_audit_logs (
    user_id, action, resource, metadata, severity
  ) VALUES (
    p_user_id, 'RATE_LIMIT_CHECK', p_action,
    json_build_object(
      'current_count', request_count,
      'limit', actual_limit,
      'is_admin', is_admin,
      'window_minutes', p_window_minutes
    ),
    CASE WHEN request_count >= actual_limit THEN 'warning' ELSE 'info' END
  );
  
  -- Detectar atividade suspeita se muito próximo do limite
  IF request_count >= (actual_limit * 0.8) THEN
    PERFORM public.detect_suspicious_activity(p_user_id, p_action, actual_limit);
  END IF;
  
  RETURN request_count < actual_limit;
END;
$$;
