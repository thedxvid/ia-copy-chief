
-- 1. Atualizar função reset_monthly_tokens para usar 100.000 tokens
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    monthly_tokens = 100000,
    tokens_reset_date = CURRENT_DATE,
    notified_90 = false,
    notified_50 = false,
    notified_10 = false
  WHERE tokens_reset_date < CURRENT_DATE;
END;
$function$;

-- 2. Atualizar valor padrão da coluna monthly_tokens para 100.000
ALTER TABLE public.profiles 
ALTER COLUMN monthly_tokens SET DEFAULT 100000;

-- 3. Atualizar usuários existentes que têm 25.000 tokens para 100.000
-- (apenas usuários que não utilizaram muitos tokens ainda)
UPDATE public.profiles 
SET monthly_tokens = 100000
WHERE monthly_tokens = 25000;

-- 4. Criar tabela para pacotes de tokens adicionais
CREATE TABLE public.token_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  price_brl NUMERIC(10,2) NOT NULL,
  checkout_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Inserir os pacotes de tokens disponíveis
INSERT INTO public.token_packages (name, tokens_amount, price_brl, checkout_url, description) VALUES
('100K Tokens', 100000, 97.00, 'PLACEHOLDER_URL_1', '100 mil tokens adicionais'),
('250K Tokens', 250000, 197.00, 'PLACEHOLDER_URL_2', '250 mil tokens adicionais'),
('500K Tokens', 500000, 297.00, 'PLACEHOLDER_URL_3', '500 mil tokens adicionais'),
('1M Tokens', 1000000, 397.00, 'PLACEHOLDER_URL_4', '1 milhão de tokens adicionais');

-- 6. Habilitar RLS na tabela token_packages
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

-- 7. Política para permitir que todos vejam os pacotes ativos
CREATE POLICY "Anyone can view active packages" ON public.token_packages
  FOR SELECT USING (is_active = true);

-- 8. Política para admins gerenciarem pacotes
CREATE POLICY "Admins can manage packages" ON public.token_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 9. Criar tabela para histórico de compras de tokens
CREATE TABLE public.token_package_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.token_packages(id) NOT NULL,
  tokens_purchased INTEGER NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  digital_guru_order_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Habilitar RLS na tabela de compras
ALTER TABLE public.token_package_purchases ENABLE ROW LEVEL SECURITY;

-- 11. Política para usuários verem suas próprias compras
CREATE POLICY "Users can view own purchases" ON public.token_package_purchases
  FOR SELECT USING (user_id = auth.uid());

-- 12. Política para inserção de compras (usado pelo webhook)
CREATE POLICY "Allow purchase inserts" ON public.token_package_purchases
  FOR INSERT WITH CHECK (true);

-- 13. Política para admins verem todas as compras
CREATE POLICY "Admins can view all purchases" ON public.token_package_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
