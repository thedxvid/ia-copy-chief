
-- Atualizar URLs de checkout dos pacotes de tokens com os links corretos

-- 100 mil tokens
UPDATE public.token_packages 
SET checkout_url = 'https://clkdmg.site/pay/100-mil-tokens'
WHERE tokens_amount = 100000;

-- 250 mil tokens  
UPDATE public.token_packages 
SET checkout_url = 'https://clkdmg.site/pay/250-mil-tokens'
WHERE tokens_amount = 250000;

-- 500 mil tokens
UPDATE public.token_packages 
SET checkout_url = 'https://clkdmg.site/pay/500-mil-tokens' 
WHERE tokens_amount = 500000;

-- 1 milhão de tokens
UPDATE public.token_packages 
SET checkout_url = 'https://clkdmg.site/pay/1-milhao-de-tokens'
WHERE tokens_amount = 1000000;

-- Verificar se as atualizações foram aplicadas corretamente
SELECT name, tokens_amount, checkout_url 
FROM public.token_packages 
WHERE is_active = true 
ORDER BY tokens_amount;
