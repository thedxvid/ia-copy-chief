
-- Etapa 1: Remover todas as políticas que dependem da função is_user_admin
DROP POLICY IF EXISTS "Admins can view all templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can create any template" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can update any template" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can delete any template" ON public.quiz_templates;

-- Remover políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Etapa 2: Agora podemos remover e recriar a função is_user_admin
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Etapa 3: Recriar políticas RLS corretas para profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_user_admin(auth.uid()));

-- Etapa 4: Recriar políticas para quiz_templates
CREATE POLICY "Admins can view all templates" 
ON public.quiz_templates 
FOR SELECT 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can create any template" 
ON public.quiz_templates 
FOR INSERT 
WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update any template" 
ON public.quiz_templates 
FOR UPDATE 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can delete any template" 
ON public.quiz_templates 
FOR DELETE 
USING (public.is_user_admin(auth.uid()));

-- Garantir que RLS está habilitado em ambas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;
