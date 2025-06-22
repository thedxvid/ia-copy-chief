
-- 1. Corrigir função secure_deduct_tokens para NUNCA deduzir de monthly_tokens
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
  v_extra_tokens INTEGER;
BEGIN
  -- Verificar se a requisição não excede 2000 tokens (bloqueio de segurança)
  IF p_amount > 2000 THEN
    RAISE WARNING 'Requisição bloqueada: tentativa de usar % tokens (limite: 2000)', p_amount;
    RETURN FALSE;
  END IF;

  -- Bloqueia a linha do usuário para evitar condições de corrida
  SELECT extra_tokens
  INTO v_extra_tokens
  FROM public.profiles 
  WHERE id = p_user_id 
  FOR UPDATE;

  -- Verifica se o usuário existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- CORREÇÃO CRÍTICA: Verificar se há tokens DISPONÍVEIS suficientes (apenas extra_tokens)
  IF COALESCE(v_extra_tokens, 0) < p_amount THEN
    RAISE WARNING 'Tokens insuficientes para usuário %: disponível=%, necessário=%', p_user_id, COALESCE(v_extra_tokens, 0), p_amount;
    RETURN FALSE; -- Tokens insuficientes
  END IF;

  -- CORREÇÃO: Deduzir APENAS de extra_tokens (tokens realmente disponíveis)
  -- monthly_tokens permanece inalterado (é apenas um limite/quota)
  UPDATE public.profiles
  SET 
    extra_tokens = extra_tokens - p_amount,
    total_tokens_used = COALESCE(total_tokens_used, 0) + p_amount,
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
    p_amount,
    p_feature_used,
    p_amount,
    now()
  );

  RETURN TRUE; -- Sucesso
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro ao deduzir tokens para usuário %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- 2. Corrigir check_token_balance: total_available = apenas extra_tokens
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
    -- CORREÇÃO CRÍTICA: total_available = apenas extra_tokens (tokens realmente disponíveis)
    COALESCE(p.extra_tokens, 0) as total_available,
    COALESCE(p.total_tokens_used, 0) as total_used
  FROM public.profiles p 
  WHERE p.id = p_user_id;
END;
$$;

-- 3. Corrigir get_available_tokens também
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
    -- CORREÇÃO: Total disponível = apenas extra_tokens (tokens comprados/disponíveis)
    p.extra_tokens as total_available,
    p.total_tokens_used
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- 4. Corrigir consume_tokens para mesma lógica
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
  v_extra_tokens INTEGER;
BEGIN
  -- Verificar limite de segurança de 2000 tokens
  IF p_tokens_used > 2000 THEN
    RAISE WARNING 'Requisição bloqueada: tentativa de usar % tokens (limite: 2000)', p_tokens_used;
    RETURN FALSE;
  END IF;

  -- Trava a linha do perfil do usuário
  SELECT extra_tokens INTO v_extra_tokens
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE WARNING 'Perfil não encontrado para o usuário %', p_user_id;
    RETURN FALSE;
  END IF;

  -- CORREÇÃO: Verificar apenas extra_tokens (tokens disponíveis)
  IF COALESCE(v_extra_tokens, 0) < p_tokens_used THEN
    RAISE WARNING 'Tokens insuficientes para usuário %: disponível=%, necessário=%', p_user_id, COALESCE(v_extra_tokens, 0), p_tokens_used;
    RETURN FALSE;
  END IF;

  -- CORREÇÃO: Deduzir APENAS de extra_tokens
  UPDATE public.profiles
  SET
    extra_tokens = extra_tokens - p_tokens_used,
    total_tokens_used = COALESCE(total_tokens_used, 0) + p_tokens_used,
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
    p_tokens_used,
    p_feature_used,
    p_prompt_tokens,
    p_completion_tokens,
    p_tokens_used
  );

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro inesperado na função consume_tokens: %', SQLERRM;
    RETURN FALSE;
END;
$$;
