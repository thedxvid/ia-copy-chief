
-- Criar tabela para logs de segurança e auditoria
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_resource ON public.security_logs(resource);

-- Ativar RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para security_logs
CREATE POLICY "Users can view their own security logs" 
  ON public.security_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security logs" 
  ON public.security_logs 
  FOR INSERT 
  WITH CHECK (true); -- Permitir inserção do sistema

CREATE POLICY "Admins can view all security logs" 
  ON public.security_logs 
  FOR SELECT 
  USING (public.is_user_admin(auth.uid()));

-- Função para limpeza automática de logs antigos (manter apenas 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.security_logs 
  WHERE created_at < (now() - interval '90 days');
END;
$$;

-- Trigger para limpeza automática (executar diariamente)
-- Nota: Este seria configurado via cron job em produção

COMMENT ON TABLE public.security_logs IS 'Logs de auditoria e segurança do sistema';
COMMENT ON COLUMN public.security_logs.action IS 'Ação realizada (ex: CREATE_PRODUCT, DELETE_USER)';
COMMENT ON COLUMN public.security_logs.resource IS 'Recurso afetado (ex: product:123, user:456)';
COMMENT ON COLUMN public.security_logs.metadata IS 'Dados adicionais sobre a ação';
