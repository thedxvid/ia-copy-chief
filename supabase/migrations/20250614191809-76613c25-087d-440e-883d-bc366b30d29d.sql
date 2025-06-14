
-- Criar tabela para agentes customizados
CREATE TABLE public.custom_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Bot',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  knowledge_base JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para arquivos dos agentes
CREATE TABLE public.agent_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.custom_agents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  processed_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para custom_agents
CREATE POLICY "Users can view their own agents" 
  ON public.custom_agents 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents" 
  ON public.custom_agents 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" 
  ON public.custom_agents 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" 
  ON public.custom_agents 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para agent_files
CREATE POLICY "Users can view files of their own agents" 
  ON public.agent_files 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.custom_agents 
    WHERE id = agent_files.agent_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create files for their own agents" 
  ON public.agent_files 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_agents 
    WHERE id = agent_files.agent_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update files of their own agents" 
  ON public.agent_files 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.custom_agents 
    WHERE id = agent_files.agent_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete files of their own agents" 
  ON public.agent_files 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.custom_agents 
    WHERE id = agent_files.agent_id AND user_id = auth.uid()
  ));

-- Criar bucket para arquivos dos agentes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-files',
  'agent-files',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Políticas para o bucket de arquivos
CREATE POLICY "Users can upload files for their agents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files for their agents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'agent-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete files for their agents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_custom_agents_updated_at
  BEFORE UPDATE ON public.custom_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
