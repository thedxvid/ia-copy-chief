
-- Primeiro, remover as políticas que dependem da função is_user_admin
DROP POLICY IF EXISTS "Admin users can insert quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admin users can update quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admin users can delete quiz templates" ON public.quiz_templates;

-- Agora podemos remover e recriar a função
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id),
    false
  );
$$;

-- Recriar as políticas RLS usando a nova função
CREATE POLICY "Admin users can insert quiz templates" 
ON public.quiz_templates 
FOR INSERT 
WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admin users can update quiz templates" 
ON public.quiz_templates 
FOR UPDATE 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admin users can delete quiz templates" 
ON public.quiz_templates 
FOR DELETE 
USING (public.is_user_admin(auth.uid()));
