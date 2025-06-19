
-- Corrigir usuários que receberam 100.000 tokens incorretamente
-- Atualizar apenas usuários que têm exatamente 100.000 tokens mensais (não utilizados)
UPDATE public.profiles 
SET monthly_tokens = 25000
WHERE monthly_tokens = 100000 
  AND total_tokens_used = 0;

-- Para usuários que já usaram alguns tokens dos 100k, ajustar proporcionalmente
-- Manter a mesma proporção de uso, mas baseado em 25k
UPDATE public.profiles 
SET monthly_tokens = GREATEST(0, 25000 - total_tokens_used)
WHERE monthly_tokens = 100000 
  AND total_tokens_used > 0
  AND total_tokens_used < 100000;

-- Atualizar o valor padrão da coluna para novos usuários
ALTER TABLE public.profiles 
ALTER COLUMN monthly_tokens SET DEFAULT 25000;

-- Log das alterações feitas para verificação
SELECT 
  'Correção aplicada' as status,
  COUNT(*) as usuarios_corrigidos
FROM public.profiles
WHERE monthly_tokens = 25000;
