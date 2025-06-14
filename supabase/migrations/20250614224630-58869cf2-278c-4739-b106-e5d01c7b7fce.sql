
-- Expandir a tabela product_analytics para incluir métricas reais de performance
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2);
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS ctr DECIMAL(5,2);
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS sales_generated DECIMAL(12,2);
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2);
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS roi_real DECIMAL(8,2);
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS impressions INTEGER;
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS campaign_start DATE;
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS campaign_end DATE;
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.product_analytics ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Adicionar políticas RLS para product_analytics se não existirem
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- Criar política para que usuários possam ver suas próprias análises
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.product_analytics;
CREATE POLICY "Users can view their own analytics" 
  ON public.product_analytics 
  FOR SELECT 
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE user_id = auth.uid()
    )
  );

-- Criar política para que usuários possam inserir suas próprias análises
DROP POLICY IF EXISTS "Users can create their own analytics" ON public.product_analytics;
CREATE POLICY "Users can create their own analytics" 
  ON public.product_analytics 
  FOR INSERT 
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products WHERE user_id = auth.uid()
    )
  );

-- Criar política para que usuários possam atualizar suas próprias análises
DROP POLICY IF EXISTS "Users can update their own analytics" ON public.product_analytics;
CREATE POLICY "Users can update their own analytics" 
  ON public.product_analytics 
  FOR UPDATE 
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE user_id = auth.uid()
    )
  );

-- Criar política para que usuários possam deletar suas próprias análises
DROP POLICY IF EXISTS "Users can delete their own analytics" ON public.product_analytics;
CREATE POLICY "Users can delete their own analytics" 
  ON public.product_analytics 
  FOR DELETE 
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE user_id = auth.uid()
    )
  );
