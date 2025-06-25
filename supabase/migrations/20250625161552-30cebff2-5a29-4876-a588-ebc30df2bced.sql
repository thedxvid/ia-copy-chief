
-- Remover pacote de 10K tokens da lista de pacotes ativos
UPDATE public.token_packages 
SET is_active = false
WHERE tokens_amount = 10000;

-- Verificar se a atualização foi aplicada corretamente
SELECT name, tokens_amount, is_active 
FROM public.token_packages 
WHERE tokens_amount = 10000;
