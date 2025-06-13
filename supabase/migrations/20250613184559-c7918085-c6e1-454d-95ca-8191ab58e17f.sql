
-- Tabela principal de produtos/ofertas
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  sub_niche TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para estratégia do produto
CREATE TABLE public.product_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  target_audience JSONB, -- {persona, pains, desires, demographics}
  market_positioning TEXT,
  value_proposition TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para copywriting
CREATE TABLE public.product_copy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  vsl_script TEXT,
  landing_page_copy JSONB, -- {headline, subtitle, benefits, social_proof}
  social_media_content JSONB, -- {feed, stories, reels, threads}
  email_campaign JSONB, -- {subject_lines, sequences, templates}
  whatsapp_messages TEXT[],
  telegram_messages TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para estrutura da oferta
CREATE TABLE public.product_offer (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  main_offer JSONB, -- {promise, description, price}
  bonuses JSONB[], -- [{name, description, value}]
  order_bump JSONB, -- {title, argument, trigger, price}
  upsell JSONB, -- {title, script, price}
  downsell JSONB, -- {title, script, price}
  pricing_strategy JSONB, -- {anchor_price, urgency_triggers, scarcity_triggers}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para métricas e analytics
CREATE TABLE public.product_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  estimated_conversion_rate DECIMAL(5,2),
  copy_efficiency_score INTEGER CHECK (copy_efficiency_score >= 0 AND copy_efficiency_score <= 100),
  benchmark_data JSONB,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para tags e notas
CREATE TABLE public.product_meta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  tags TEXT[],
  private_notes TEXT,
  ai_evaluation JSONB, -- {score, suggestions, improvements}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de alterações
CREATE TABLE public.product_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'duplicated', 'archived'
  field_changed TEXT,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para products
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para product_strategy
CREATE POLICY "Users can view their own product strategy" ON public.product_strategy FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_strategy.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can create their own product strategy" ON public.product_strategy FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_strategy.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can update their own product strategy" ON public.product_strategy FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_strategy.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own product strategy" ON public.product_strategy FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_strategy.product_id AND products.user_id = auth.uid())
);

-- Políticas RLS para product_copy
CREATE POLICY "Users can view their own product copy" ON public.product_copy FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_copy.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can create their own product copy" ON public.product_copy FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_copy.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can update their own product copy" ON public.product_copy FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_copy.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own product copy" ON public.product_copy FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_copy.product_id AND products.user_id = auth.uid())
);

-- Políticas RLS para product_offer
CREATE POLICY "Users can view their own product offer" ON public.product_offer FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_offer.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can create their own product offer" ON public.product_offer FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_offer.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can update their own product offer" ON public.product_offer FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_offer.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own product offer" ON public.product_offer FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_offer.product_id AND products.user_id = auth.uid())
);

-- Políticas RLS para product_analytics
CREATE POLICY "Users can view their own product analytics" ON public.product_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_analytics.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can create their own product analytics" ON public.product_analytics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_analytics.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can update their own product analytics" ON public.product_analytics FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_analytics.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own product analytics" ON public.product_analytics FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_analytics.product_id AND products.user_id = auth.uid())
);

-- Políticas RLS para product_meta
CREATE POLICY "Users can view their own product meta" ON public.product_meta FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_meta.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can create their own product meta" ON public.product_meta FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_meta.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can update their own product meta" ON public.product_meta FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_meta.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own product meta" ON public.product_meta FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_meta.product_id AND products.user_id = auth.uid())
);

-- Políticas RLS para product_history
CREATE POLICY "Users can view their own product history" ON public.product_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_history.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can create their own product history" ON public.product_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = product_history.product_id AND products.user_id = auth.uid())
);

-- Índices para performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_niche ON public.products(niche);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_product_strategy_product_id ON public.product_strategy(product_id);
CREATE INDEX idx_product_copy_product_id ON public.product_copy(product_id);
CREATE INDEX idx_product_offer_product_id ON public.product_offer(product_id);
CREATE INDEX idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX idx_product_meta_product_id ON public.product_meta(product_id);
CREATE INDEX idx_product_history_product_id ON public.product_history(product_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_strategy_updated_at BEFORE UPDATE ON public.product_strategy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_copy_updated_at BEFORE UPDATE ON public.product_copy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_offer_updated_at BEFORE UPDATE ON public.product_offer
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_analytics_updated_at BEFORE UPDATE ON public.product_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_meta_updated_at BEFORE UPDATE ON public.product_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
