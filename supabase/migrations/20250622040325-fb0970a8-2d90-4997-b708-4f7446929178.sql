
-- 1. Corrigir função check_token_balance com cálculo correto
CREATE OR REPLACE FUNCTION public.check_token_balance(p_user_id UUID)
RETURNS TABLE(
  monthly_tokens INTEGER,
  extra_tokens INTEGER,
  total_available INTEGER,
  total_used INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.monthly_tokens, 0) as monthly_tokens,
    COALESCE(p.extra_tokens, 0) as extra_tokens,
    -- CORREÇÃO: total_available = (monthly_tokens - total_tokens_used) + extra_tokens
    -- Se já usou todos os mensais, só conta os extras
    GREATEST(0, COALESCE(p.monthly_tokens, 0) - COALESCE(p.total_tokens_used, 0)) + COALESCE(p.extra_tokens, 0) as total_available,
    COALESCE(p.total_tokens_used, 0) as total_used
  FROM public.profiles p 
  WHERE p.id = p_user_id;
END;
$$;

-- 2. Corrigir função get_available_tokens
CREATE OR REPLACE FUNCTION public.get_available_tokens(p_user_id uuid)
RETURNS TABLE(monthly_tokens integer, extra_tokens integer, total_available integer, total_used integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.monthly_tokens,
    p.extra_tokens,
    -- CORREÇÃO: Total disponível = tokens mensais restantes + extras
    (GREATEST(0, p.monthly_tokens - p.total_tokens_used) + p.extra_tokens) as total_available,
    p.total_tokens_used
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- 3. Corrigir secure_deduct_tokens com lógica de dedução correta
CREATE OR REPLACE FUNCTION public.secure_deduct_tokens(
  p_user_id UUID, 
  p_amount INTEGER,
  p_feature_used TEXT DEFAULT 'general'
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_monthly_tokens INTEGER;
  v_extra_tokens INTEGER;
  v_total_used INTEGER;
  v_available_monthly INTEGER;
  v_total_available INTEGER;
  v_deduct_from_monthly INTEGER;
  v_deduct_from_extra INTEGER;
BEGIN
  -- Bloqueia a linha do usuário para evitar condições de corrida
  SELECT monthly_tokens, extra_tokens, total_tokens_used
  INTO v_monthly_tokens, v_extra_tokens, v_total_used
  FROM public.profiles 
  WHERE id = p_user_id 
  FOR UPDATE;

  -- Verifica se o usuário existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calcular tokens mensais disponíveis e total disponível
  v_available_monthly := GREATEST(0, COALESCE(v_monthly_tokens, 0) - COALESCE(v_total_used, 0));
  v_total_available := v_available_monthly + COALESCE(v_extra_tokens, 0);

  -- Se não há tokens disponíveis, bloquear
  IF v_total_available <= 0 THEN
    RAISE WARNING 'Tokens insuficientes para usuário %: disponível=%, necessário=%', p_user_id, v_total_available, p_amount;
    RETURN FALSE;
  END IF;

  -- Determinar quanto deduzir de cada tipo
  -- Primeiro deduz dos mensais disponíveis, depois dos extras
  IF p_amount <= v_available_monthly THEN
    -- Deduz tudo dos tokens mensais (incrementa total_used)
    v_deduct_from_monthly := p_amount;
    v_deduct_from_extra := 0;
  ELSE
    -- Deduz o máximo dos mensais e o resto dos extras
    v_deduct_from_monthly := v_available_monthly;
    v_deduct_from_extra := p_amount - v_available_monthly;
  END IF;

  -- Se vai deduzir mais extras do que existe, ajusta para o que tem disponível
  IF v_deduct_from_extra > COALESCE(v_extra_tokens, 0) THEN
    v_deduct_from_extra := COALESCE(v_extra_tokens, 0);
  END IF;

  -- Aplicar as deduções
  UPDATE public.profiles
  SET 
    total_tokens_used = COALESCE(total_tokens_used, 0) + v_deduct_from_monthly,
    extra_tokens = COALESCE(extra_tokens, 0) - v_deduct_from_extra,
    updated_at = now()
  WHERE id = p_user_id;

  -- Registra o uso para auditoria
  INSERT INTO public.token_usage (
    user_id,
    tokens_used,
    feature_used,
    total_tokens,
    created_at
  ) VALUES (
    p_user_id,
    v_deduct_from_monthly + v_deduct_from_extra,
    p_feature_used,
    v_deduct_from_monthly + v_deduct_from_extra,
    now()
  );

  RETURN TRUE; -- Sucesso
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro ao deduzir tokens para usuário %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- 4. Corrigir consume_tokens com mesma lógica
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
SET search_path = 'public'
AS $$
DECLARE
  v_monthly_tokens INTEGER;
  v_extra_tokens INTEGER;
  v_total_used INTEGER;
  v_available_monthly INTEGER;
  v_total_available INTEGER;
  v_deduct_from_monthly INTEGER;
  v_deduct_from_extra INTEGER;
BEGIN
  -- Trava a linha do perfil do usuário
  SELECT monthly_tokens, extra_tokens, total_tokens_used
  INTO v_monthly_tokens, v_extra_tokens, v_total_used
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE WARNING 'Perfil não encontrado para o usuário %', p_user_id;
    RETURN FALSE;
  END IF;

  -- Calcular disponibilidade
  v_available_monthly := GREATEST(0, COALESCE(v_monthly_tokens, 0) - COALESCE(v_total_used, 0));
  v_total_available := v_available_monthly + COALESCE(v_extra_tokens, 0);

  -- Bloquear apenas se não há tokens disponíveis
  IF v_total_available <= 0 THEN
    RAISE WARNING 'Tokens insuficientes para usuário %: disponível=%, necessário=%', p_user_id, v_total_available, p_tokens_used;
    RETURN FALSE;
  END IF;

  -- Determinar dedução (mesma lógica da secure_deduct_tokens)
  IF p_tokens_used <= v_available_monthly THEN
    v_deduct_from_monthly := p_tokens_used;
    v_deduct_from_extra := 0;
  ELSE
    v_deduct_from_monthly := v_available_monthly;
    v_deduct_from_extra := p_tokens_used - v_available_monthly;
  END IF;

  -- Ajustar para não exceder extras disponíveis
  IF v_deduct_from_extra > COALESCE(v_extra_tokens, 0) THEN
    v_deduct_from_extra := COALESCE(v_extra_tokens, 0);
  END IF;

  -- Aplicar deduções
  UPDATE public.profiles
  SET
    total_tokens_used = COALESCE(total_tokens_used, 0) + v_deduct_from_monthly,
    extra_tokens = COALESCE(extra_tokens, 0) - v_deduct_from_extra,
    updated_at = now()
  WHERE id = p_user_id;

  -- Registra o uso
  INSERT INTO public.token_usage (
    user_id,
    tokens_used,
    feature_used,
    prompt_tokens,
    completion_tokens,
    total_tokens
  ) VALUES (
    p_user_id,
    v_deduct_from_monthly + v_deduct_from_extra,
    p_feature_used,
    p_prompt_tokens,
    p_completion_tokens,
    v_deduct_from_monthly + v_deduct_from_extra
  );

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro inesperado na função consume_tokens: %', SQLERRM;
    RETURN FALSE;
END;
$$;
