-- Corrigir a função is_admin para usar profiles.is_admin
-- Isso resolve o erro 403 ao adicionar novos usuários

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_user_id),
    false
  );
END;
$function$;