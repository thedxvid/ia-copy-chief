
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
