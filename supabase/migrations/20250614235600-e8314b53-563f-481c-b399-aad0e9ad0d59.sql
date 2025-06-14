
-- Criar tabela para armazenar copies geradas pelo quiz
CREATE TABLE public.quiz_copies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL,
  quiz_answers JSONB NOT NULL,
  generated_copy JSONB NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.quiz_copies ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem suas próprias copies do quiz
CREATE POLICY "Users can view their own quiz copies" 
  ON public.quiz_copies 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias copies do quiz
CREATE POLICY "Users can create their own quiz copies" 
  ON public.quiz_copies 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias copies do quiz
CREATE POLICY "Users can update their own quiz copies" 
  ON public.quiz_copies 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para usuários excluírem suas próprias copies do quiz
CREATE POLICY "Users can delete their own quiz copies" 
  ON public.quiz_copies 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_quiz_copies_updated_at
  BEFORE UPDATE ON public.quiz_copies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
