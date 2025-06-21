
-- Corrigir a função is_user_admin para usar o parâmetro correto
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_user_id LIMIT 1),
    false
  );
$$;

-- Corrigir a função admin_update_user_tokens com melhor tratamento de erros e logs
CREATE OR REPLACE FUNCTION public.admin_update_user_tokens(
  p_target_user_id UUID,
  p_action_type TEXT,
  p_value INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_user_id UUID;
  v_is_admin BOOLEAN;
  v_old_monthly INTEGER;
  v_old_extra INTEGER;
  v_new_monthly INTEGER;
  v_new_extra INTEGER;
BEGIN
  -- Obter o usuário atual
  v_admin_user_id := auth.uid();
  
  -- Log de debug
  RAISE NOTICE 'admin_update_user_tokens: admin_user_id=%, target_user_id=%', v_admin_user_id, p_target_user_id;
  
  -- Verificar se o usuário atual existe
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: No authenticated user found';
  END IF;

  -- Verificar se o usuário atual é admin com log detalhado
  SELECT public.is_user_admin(v_admin_user_id) INTO v_is_admin;
  
  RAISE NOTICE 'admin_update_user_tokens: is_admin check result=%', v_is_admin;
  
  IF NOT v_is_admin THEN
    -- Verificar se o perfil existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_user_id) THEN
      RAISE EXCEPTION 'Access denied: User profile not found';
    END IF;
    
    -- Verificar o valor exato do campo is_admin
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = v_admin_user_id;
    RAISE NOTICE 'admin_update_user_tokens: direct is_admin value=%', v_is_admin;
    
    RAISE EXCEPTION 'Access denied: Admin privileges required (current user is_admin=%)', v_is_admin;
  END IF;

  -- Validar parâmetros
  IF p_action_type NOT IN ('add_monthly', 'add_extra', 'set_monthly', 'set_extra', 'reset_monthly') THEN
    RAISE EXCEPTION 'Invalid action type: %', p_action_type;
  END IF;

  IF p_value < 0 THEN
    RAISE EXCEPTION 'Token value cannot be negative: %', p_value;
  END IF;

  -- Obter valores atuais do usuário alvo
  SELECT monthly_tokens, extra_tokens
  INTO v_old_monthly, v_old_extra
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found: %', p_target_user_id;
  END IF;

  RAISE NOTICE 'admin_update_user_tokens: old values monthly=%, extra=%', v_old_monthly, v_old_extra;

  -- Aplicar a ação
  CASE p_action_type
    WHEN 'add_monthly' THEN
      v_new_monthly := COALESCE(v_old_monthly, 0) + p_value;
      v_new_extra := COALESCE(v_old_extra, 0);
    WHEN 'add_extra' THEN
      v_new_monthly := COALESCE(v_old_monthly, 0);
      v_new_extra := COALESCE(v_old_extra, 0) + p_value;
    WHEN 'set_monthly' THEN
      v_new_monthly := p_value;
      v_new_extra := COALESCE(v_old_extra, 0);
    WHEN 'set_extra' THEN
      v_new_monthly := COALESCE(v_old_monthly, 0);
      v_new_extra := p_value;
    WHEN 'reset_monthly' THEN
      v_new_monthly := 100000; -- Valor padrão
      v_new_extra := COALESCE(v_old_extra, 0);
  END CASE;

  RAISE NOTICE 'admin_update_user_tokens: new values monthly=%, extra=%', v_new_monthly, v_new_extra;

  -- Atualizar os tokens
  UPDATE public.profiles
  SET 
    monthly_tokens = v_new_monthly,
    extra_tokens = v_new_extra,
    updated_at = now()
  WHERE id = p_target_user_id;

  RAISE NOTICE 'admin_update_user_tokens: tokens updated successfully';

  -- Registrar no log de auditoria para tokens mensais (se alterados)
  IF COALESCE(v_old_monthly, 0) != v_new_monthly THEN
    INSERT INTO public.token_audit_logs (
      user_id, admin_user_id, action_type, old_value, new_value, reason
    ) VALUES (
      p_target_user_id, v_admin_user_id, 
      CASE 
        WHEN p_action_type = 'reset_monthly' THEN 'reset_monthly'
        ELSE REPLACE(p_action_type, '_extra', '_monthly')
      END,
      COALESCE(v_old_monthly, 0), v_new_monthly, p_reason
    );
  END IF;

  -- Registrar no log de auditoria para tokens extras (se alterados)
  IF COALESCE(v_old_extra, 0) != v_new_extra AND p_action_type LIKE '%extra%' THEN
    INSERT INTO public.token_audit_logs (
      user_id, admin_user_id, action_type, old_value, new_value, reason
    ) VALUES (
      p_target_user_id, v_admin_user_id, p_action_type, COALESCE(v_old_extra, 0), v_new_extra, p_reason
    );
  END IF;

  RAISE NOTICE 'admin_update_user_tokens: audit logs created successfully';

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'admin_update_user_tokens: ERROR - %', SQLERRM;
    RAISE;
END;
$$;

-- Corrigir a função check_token_balance para calcular total_available corretamente
CREATE OR REPLACE FUNCTION public.check_token_balance(p_user_id UUID)
RETURNS TABLE(
  monthly_tokens INTEGER,
  extra_tokens INTEGER,
  total_available INTEGER,
  total_used INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.monthly_tokens, 0) as monthly_tokens,
    COALESCE(p.extra_tokens, 0) as extra_tokens,
    -- CORREÇÃO: Subtrair tokens usados do total disponível
    GREATEST(0, COALESCE(p.monthly_tokens, 0) + COALESCE(p.extra_tokens, 0) - COALESCE(p.total_tokens_used, 0)) as total_available,
    COALESCE(p.total_tokens_used, 0) as total_used
  FROM public.profiles p 
  WHERE p.id = p_user_id;
END;
$$;
