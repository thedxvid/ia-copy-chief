
-- Adicionar campo product_id nas tabelas para vincular com produtos
ALTER TABLE public.specialized_copies 
ADD COLUMN product_id UUID REFERENCES public.products(id);

ALTER TABLE public.quiz_copies 
ADD COLUMN product_id UUID REFERENCES public.products(id);

ALTER TABLE public.chat_sessions 
ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Criar índices para melhor performance
CREATE INDEX idx_specialized_copies_product_id ON public.specialized_copies(product_id);
CREATE INDEX idx_quiz_copies_product_id ON public.quiz_copies(product_id);
CREATE INDEX idx_chat_sessions_product_id ON public.chat_sessions(product_id);
