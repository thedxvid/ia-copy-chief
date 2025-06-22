
-- 1. Inserir pacote de 10K tokens que está faltando
INSERT INTO public.token_packages (name, tokens_amount, price_brl, checkout_url, description) 
VALUES (
  '10K Tokens', 
  10000, 
  10.00, 
  'https://clkdmg.site/pay/10-mil-tokens', 
  '10 mil tokens adicionais'
);

-- 2. Verificar se todos os pacotes necessários existem
-- (Nota: Os outros pacotes já existem conforme a migração anterior)
