
-- 1. Corrigir função is_admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = p_user_id
  );
END;
$$;

-- 2. Corrigir função is_user_admin_by_profile
CREATE OR REPLACE FUNCTION public.is_user_admin_by_profile(p_user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_user_id),
    false
  );
END;
$$;

-- 3. Corrigir função is_user_admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- 4. Corrigir função secure_deduct_tokens
CREATE OR REPLACE FUNCTION public.secure_deduct_tokens(
  p_user_id UUID, 
  p_amount INTEGER,
  p_feature_used TEXT DEFAULT 'general'
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_tokens INTEGER;
  v_extra_tokens INTEGER;
  v_total_available INTEGER;
  v_tokens_to_deduct INTEGER;
BEGIN
  -- Bloqueia a linha do usuário para evitar condições de corrida
  SELECT monthly_tokens, extra_tokens
  INTO v_monthly_tokens, v_extra_tokens
  FROM public.profiles 
  WHERE id = p_user_id 
  FOR UPDATE;

  -- Verifica se o usuário existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calcula o total disponível
  v_total_available := COALESCE(v_monthly_tokens, 0) + COALESCE(v_extra_tokens, 0);

  -- Verifica se há tokens suficientes
  IF v_total_available < p_amount THEN
    RETURN FALSE; -- Tokens insuficientes
  END IF;

  -- Deduz tokens (prioriza tokens extras primeiro, depois mensais)
  v_tokens_to_deduct := p_amount;
  
  -- Deduz dos tokens extras primeiro
  IF v_extra_tokens > 0 THEN
    IF v_extra_tokens >= v_tokens_to_deduct THEN
      -- Todos os tokens vêm dos extras
      UPDATE public.profiles
      SET 
        extra_tokens = extra_tokens - v_tokens_to_deduct,
        total_tokens_used = COALESCE(total_tokens_used, 0) + p_amount,
        updated_at = now()
      WHERE id = p_user_id;
      v_tokens_to_deduct := 0;
    ELSE
      -- Usa todos os tokens extras e parte dos mensais
      v_tokens_to_deduct := v_tokens_to_deduct - v_extra_tokens;
      UPDATE public.profiles
      SET 
        extra_tokens = 0,
        monthly_tokens = monthly_tokens - v_tokens_to_deduct,
        total_tokens_used = COALESCE(total_tokens_used, 0) + p_amount,
        updated_at = now()
      WHERE id = p_user_id;
    END IF;
  ELSE
    -- Deduz apenas dos tokens mensais
    UPDATE public.profiles
    SET 
      monthly_tokens = monthly_tokens - v_tokens_to_deduct,
      total_tokens_used = COALESCE(total_tokens_used, 0) + p_amount,
      updated_at = now()
    WHERE id = p_user_id;
  END IF;

  -- Registra o uso para auditoria
  INSERT INTO public.token_usage (
    user_id,
    tokens_used,
    feature_used,
    total_tokens,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_feature_used,
    p_amount,
    now()
  );

  RETURN TRUE; -- Sucesso
EXCEPTION
  WHEN others THEN
    -- Em caso de erro, retorna falha
    RAISE WARNING 'Erro ao deduzir tokens para usuário %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- 5. Corrigir função check_token_balance
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
    COALESCE(p.monthly_tokens, 0) + COALESCE(p.extra_tokens, 0) as total_available,
    COALESCE(p.total_tokens_used, 0) as total_used
  FROM public.profiles p 
  WHERE p.id = p_user_id;
END;
$$;

-- 6. Corrigir função refund_tokens
CREATE OR REPLACE FUNCTION public.refund_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Operation failed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Adiciona os tokens de volta (como extras para não afetar o limite mensal)
  UPDATE public.profiles
  SET 
    extra_tokens = COALESCE(extra_tokens, 0) + p_amount,
    total_tokens_used = GREATEST(0, COALESCE(total_tokens_used, 0) - p_amount),
    updated_at = now()
  WHERE id = p_user_id;

  -- Registra o reembolso para auditoria
  INSERT INTO public.token_usage (
    user_id,
    tokens_used,
    feature_used,
    total_tokens,
    created_at
  ) VALUES (
    p_user_id,
    -p_amount, -- Valor negativo indica reembolso
    'refund: ' || p_reason,
    -p_amount,
    now()
  );

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro ao reembolsar tokens para usuário %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- 7. Corrigir função admin_update_user_tokens
CREATE OR REPLACE FUNCTION public.admin_update_user_tokens(
  p_target_user_id UUID,
  p_action_type TEXT,
  p_value INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 8. Corrigir função consume_tokens
CREATE OR REPLACE FUNCTION public.consume_tokens(
  p_user_id uuid, 
  p_tokens_used integer, 
  p_feature_used character varying, 
  p_prompt_tokens integer DEFAULT 0, 
  p_completion_tokens integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  available_tokens INTEGER;
BEGIN
  -- 1. Trava a linha do perfil do usuário para evitar condições de corrida
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- 2. Se o perfil não for encontrado, retorna falha
  IF NOT FOUND THEN
    RAISE WARNING 'Falha ao consumir tokens: Perfil não encontrado para o usuário %', p_user_id;
    RETURN FALSE;
  END IF;

  -- 3. Calcula o total de tokens disponíveis (mensais + extras)
  available_tokens := user_profile.monthly_tokens + user_profile.extra_tokens;

  -- 4. VERIFICAÇÃO DE LIMITE
  IF available_tokens < p_tokens_used THEN
    RAISE WARNING 'Falha ao consumir tokens: Saldo insuficiente para o usuário %. Disponível: %, Necessário: %', p_user_id, available_tokens, p_tokens_used;
    RETURN FALSE;
  END IF;

  -- 5. Lógica de consumo: Prioriza tokens extras, depois os mensais
  UPDATE public.profiles
  SET
    extra_tokens = GREATEST(0, extra_tokens - p_tokens_used),
    monthly_tokens = GREATEST(0, monthly_tokens - GREATEST(0, p_tokens_used - extra_tokens)),
    total_tokens_used = total_tokens_used + p_tokens_used
  WHERE id = p_user_id;

  -- 6. Registra o detalhe do uso na tabela 'token_usage'
  INSERT INTO public.token_usage (
    user_id,
    tokens_used,
    feature_used,
    prompt_tokens,
    completion_tokens,
    total_tokens
  ) VALUES (
    p_user_id,
    p_tokens_used,
    p_feature_used,
    p_prompt_tokens,
    p_completion_tokens,
    p_tokens_used
  );

  -- 7. Retorna sucesso
  RETURN TRUE;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro inesperado na função consume_tokens: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 9. Corrigir função get_available_tokens
CREATE OR REPLACE FUNCTION public.get_available_tokens(p_user_id uuid)
RETURNS TABLE(monthly_tokens integer, extra_tokens integer, total_available integer, total_used integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.monthly_tokens,
    p.extra_tokens,
    (p.monthly_tokens + p.extra_tokens) as total_available,
    p.total_tokens_used
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- 10. Corrigir função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

-- 11. Corrigir função reset_monthly_tokens
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    monthly_tokens = 100000,
    tokens_reset_date = CURRENT_DATE,
    notified_90 = false,
    notified_50 = false,
    notified_10 = false
  WHERE tokens_reset_date < CURRENT_DATE;
END;
$$;

-- 12. Corrigir função check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_id uuid,
  action_type text,
  max_requests integer DEFAULT 10,
  time_window interval DEFAULT '1 minute'::interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Contar requests recentes
  SELECT COUNT(*) INTO request_count
  FROM public.token_usage
  WHERE user_id = check_rate_limit.user_id
    AND feature_used = action_type
    AND created_at > (now() - time_window);
  
  -- Retornar se está dentro do limite
  RETURN request_count < max_requests;
END;
$$;

-- 13. Corrigir função get_user_emails
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;
