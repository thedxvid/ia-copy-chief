
-- 1. Remover TODAS as políticas RLS existentes da tabela quiz_templates
DROP POLICY IF EXISTS "Users can view active templates or own templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Anyone can view active quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admin users can insert quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admin users can update quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admin users can delete quiz templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.quiz_templates;

-- 2. Remover a função is_user_admin que está causando o problema
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

-- 3. Garantir que RLS está habilitado
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS simplificadas e funcionais

-- Política para SELECT: usuários podem ver templates ativos OU seus próprios templates
CREATE POLICY "Users can view templates" 
ON public.quiz_templates 
FOR SELECT 
USING (
  is_active = true 
  OR created_by = auth.uid()
);

-- Política para INSERT: usuários autenticados podem criar templates
CREATE POLICY "Users can create templates" 
ON public.quiz_templates 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);

-- Política para UPDATE: usuários podem atualizar apenas seus próprios templates
CREATE POLICY "Users can update own templates" 
ON public.quiz_templates 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Política para DELETE: usuários podem deletar apenas seus próprios templates
CREATE POLICY "Users can delete own templates" 
ON public.quiz_templates 
FOR DELETE 
USING (created_by = auth.uid());
