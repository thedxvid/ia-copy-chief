
-- Criar tabela para copies especializadas
CREATE TABLE public.specialized_copies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  copy_type TEXT NOT NULL CHECK (copy_type IN ('ads', 'sales-videos', 'pages', 'content')),
  title TEXT NOT NULL,
  copy_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  platform TEXT,
  performance_metrics JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  parent_copy_id UUID REFERENCES public.specialized_copies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para melhor performance
CREATE INDEX idx_specialized_copies_user_id ON public.specialized_copies(user_id);
CREATE INDEX idx_specialized_copies_type ON public.specialized_copies(copy_type);
CREATE INDEX idx_specialized_copies_status ON public.specialized_copies(status);
CREATE INDEX idx_specialized_copies_platform ON public.specialized_copies(platform);

-- Habilitar RLS
ALTER TABLE public.specialized_copies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para segurança
CREATE POLICY "Users can view their own specialized copies" 
  ON public.specialized_copies 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own specialized copies" 
  ON public.specialized_copies 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own specialized copies" 
  ON public.specialized_copies 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own specialized copies" 
  ON public.specialized_copies 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_specialized_copies_updated_at
  BEFORE UPDATE ON public.specialized_copies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
