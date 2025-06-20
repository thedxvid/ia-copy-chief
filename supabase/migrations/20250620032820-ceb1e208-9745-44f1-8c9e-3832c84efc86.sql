
-- Otimizar a função get_available_tokens para melhor performance e consistência
CREATE OR REPLACE FUNCTION public.get_available_tokens(p_user_id UUID)
RETURNS TABLE(
  monthly_tokens INTEGER,
  extra_tokens INTEGER, 
  total_available INTEGER,
  total_used INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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

-- Garantir que as tabelas tenham realtime habilitado para sincronização
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.token_usage REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação do realtime se ainda não estiverem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'token_usage'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.token_usage;
  END IF;
END $$;
