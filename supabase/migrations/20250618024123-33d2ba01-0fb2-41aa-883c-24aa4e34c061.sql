
-- 1. Criar função SECURITY DEFINER para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND email IN ('davicastrowp@gmail.com', 'admin@iacopychief.com')
  );
$$;

-- 2. Adicionar campo is_admin na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 3. Atualizar perfis dos administradores
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email IN ('davicastrowp@gmail.com', 'admin@iacopychief.com')
);

-- 4. Remover políticas RLS existentes da tabela quiz_templates
DROP POLICY IF EXISTS "Admin users can manage quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Anyone can view active default templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can manage quiz templates" ON public.quiz_templates;

-- 5. Criar novas políticas RLS simplificadas
CREATE POLICY "Anyone can view active templates" 
ON public.quiz_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can insert templates" 
ON public.quiz_templates 
FOR INSERT 
WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update templates" 
ON public.quiz_templates 
FOR UPDATE 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can delete templates" 
ON public.quiz_templates 
FOR DELETE 
USING (public.is_user_admin(auth.uid()));

-- 6. Garantir que RLS está habilitado
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;
