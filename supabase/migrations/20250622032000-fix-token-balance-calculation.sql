
-- Corrigir função check_token_balance para calcular corretamente tokens disponíveis
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
    -- CORREÇÃO: Tokens disponíveis = mensais + extras (não subtrair os usados aqui)
    COALESCE(p.monthly_tokens, 0) + COALESCE(p.extra_tokens, 0) as total_available,
    COALESCE(p.total_tokens_used, 0) as total_used
  FROM public.profiles p 
  WHERE p.id = p_user_id;
END;
$$;

-- Corrigir função get_available_tokens também
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
    -- CORREÇÃO: Total disponível = tokens mensais + extras
    (p.monthly_tokens + p.extra_tokens) as total_available,
    p.total_tokens_used
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;
