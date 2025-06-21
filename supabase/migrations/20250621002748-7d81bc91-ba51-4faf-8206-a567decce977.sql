
-- Criar tabela para auditoria de alterações de tokens
CREATE TABLE public.token_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('add_monthly', 'add_extra', 'set_monthly', 'set_extra', 'reset_monthly')),
  old_value INTEGER NOT NULL,
  new_value INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.token_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todos os logs
CREATE POLICY "Admins can view all token audit logs" 
  ON public.token_audit_logs 
  FOR SELECT 
  USING (public.is_user_admin(auth.uid()));

-- Função para atualizar tokens de usuário (apenas para admins)
CREATE OR REPLACE FUNCTION public.admin_update_user_tokens(
  p_target_user_id UUID,
  p_action_type TEXT,
  p_value INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_user_id UUID;
  v_old_monthly INTEGER;
  v_old_extra INTEGER;
  v_new_monthly INTEGER;
  v_new_extra INTEGER;
BEGIN
  -- Verificar se o usuário atual é admin
  v_admin_user_id := auth.uid();
  IF NOT public.is_user_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validar parâmetros
  IF p_action_type NOT IN ('add_monthly', 'add_extra', 'set_monthly', 'set_extra', 'reset_monthly') THEN
    RAISE EXCEPTION 'Invalid action type';
  END IF;

  IF p_value < 0 THEN
    RAISE EXCEPTION 'Token value cannot be negative';
  END IF;

  -- Obter valores atuais
  SELECT monthly_tokens, extra_tokens
  INTO v_old_monthly, v_old_extra
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Aplicar a ação
  CASE p_action_type
    WHEN 'add_monthly' THEN
      v_new_monthly := v_old_monthly + p_value;
      v_new_extra := v_old_extra;
    WHEN 'add_extra' THEN
      v_new_monthly := v_old_monthly;
      v_new_extra := v_old_extra + p_value;
    WHEN 'set_monthly' THEN
      v_new_monthly := p_value;
      v_new_extra := v_old_extra;
    WHEN 'set_extra' THEN
      v_new_monthly := v_old_monthly;
      v_new_extra := p_value;
    WHEN 'reset_monthly' THEN
      v_new_monthly := 100000; -- Valor padrão
      v_new_extra := v_old_extra;
  END CASE;

  -- Atualizar os tokens
  UPDATE public.profiles
  SET 
    monthly_tokens = v_new_monthly,
    extra_tokens = v_new_extra,
    updated_at = now()
  WHERE id = p_target_user_id;

  -- Registrar no log de auditoria para tokens mensais (se alterados)
  IF v_old_monthly != v_new_monthly THEN
    INSERT INTO public.token_audit_logs (
      user_id, admin_user_id, action_type, old_value, new_value, reason
    ) VALUES (
      p_target_user_id, v_admin_user_id, 
      CASE 
        WHEN p_action_type = 'reset_monthly' THEN 'reset_monthly'
        ELSE REPLACE(p_action_type, '_extra', '_monthly')
      END,
      v_old_monthly, v_new_monthly, p_reason
    );
  END IF;

  -- Registrar no log de auditoria para tokens extras (se alterados)
  IF v_old_extra != v_new_extra AND p_action_type LIKE '%extra%' THEN
    INSERT INTO public.token_audit_logs (
      user_id, admin_user_id, action_type, old_value, new_value, reason
    ) VALUES (
      p_target_user_id, v_admin_user_id, p_action_type, v_old_extra, v_new_extra, p_reason
    );
  END IF;

  RETURN TRUE;
END;
$$;
