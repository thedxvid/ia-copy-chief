
-- 1. Remover TODAS as políticas RLS existentes da tabela quiz_templates
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admin users can manage quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Anyone can view active default templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can manage quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can create quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can edit quiz templates" ON public.quiz_templates;

-- 2. Criar políticas RLS limpas e corretas usando APENAS a função is_user_admin
CREATE POLICY "Anyone can view active quiz templates" 
ON public.quiz_templates 
FOR SELECT 
USING (is_active = true);

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

-- 3. Garantir que RLS está habilitado
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se a função is_user_admin está funcionando corretamente
-- (Este SELECT só será executado se as políticas acima forem aplicadas com sucesso)
SELECT public.is_user_admin(auth.uid()) as admin_check;
