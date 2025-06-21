
-- Função helper para verificar se um usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = p_user_id
  );
END;
$$;

-- Função alternativa que usa a coluna is_admin da tabela profiles
-- (caso prefiram usar essa abordagem em vez da tabela admin_users)
CREATE OR REPLACE FUNCTION public.is_user_admin_by_profile(p_user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_user_id),
    false
  );
END;
$$;
