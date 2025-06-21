
-- Função para deduzir tokens de forma segura e atômica
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

-- Função para verificar saldo disponível sem fazer alterações
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
    COALESCE(p.monthly_tokens, 0) + COALESCE(p.extra_tokens, 0) as total_available,
    COALESCE(p.total_tokens_used, 0) as total_used
  FROM public.profiles p 
  WHERE p.id = p_user_id;
END;
$$;

-- Função para reverter tokens em caso de erro na operação
CREATE OR REPLACE FUNCTION public.refund_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Operation failed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
