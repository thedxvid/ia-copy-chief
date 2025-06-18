
-- Remover políticas existentes se houverem
DROP POLICY IF EXISTS "Users can view templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Users can update templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Users can delete templates" ON public.quiz_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.quiz_templates;

-- Habilitar RLS na tabela quiz_templates
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;

-- Política para visualizar: todos podem ver templates ativos OU seus próprios templates
CREATE POLICY "Users can view active templates or own templates" 
  ON public.quiz_templates 
  FOR SELECT 
  USING (
    is_active = true 
    OR created_by = auth.uid()
  );

-- Política para criar: usuários autenticados podem criar templates
CREATE POLICY "Users can create own templates" 
  ON public.quiz_templates 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

-- Política para atualizar: usuários podem atualizar apenas seus próprios templates
CREATE POLICY "Users can update own templates" 
  ON public.quiz_templates 
  FOR UPDATE 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Política para deletar: usuários podem deletar apenas seus próprios templates
CREATE POLICY "Users can delete own templates" 
  ON public.quiz_templates 
  FOR DELETE 
  USING (created_by = auth.uid());
