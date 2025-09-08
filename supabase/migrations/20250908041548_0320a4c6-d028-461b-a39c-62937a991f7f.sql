-- Implementar sistema de assinaturas mensais + tokens adicionais
-- 1. Modificar tabela token_packages para suportar dois tipos

-- Adicionar colunas para distinguir entre assinaturas e tokens extras
ALTER TABLE public.token_packages 
ADD COLUMN package_type text NOT NULL DEFAULT 'additional',
ADD COLUMN is_recurring boolean NOT NULL DEFAULT false;

-- Atualizar pacotes existentes como 'additional' (tokens extras)
UPDATE public.token_packages 
SET package_type = 'additional', is_recurring = false;

-- 2. Expandir tabela profiles com informações de plano de assinatura
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan_id uuid REFERENCES public.token_packages(id),
ADD COLUMN subscription_plan_name text;

-- 3. Criar tabela para auditoria de mudanças de plano
CREATE TABLE public.subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_plan_id UUID REFERENCES public.token_packages(id),
  new_plan_id UUID REFERENCES public.token_packages(id),
  old_plan_name TEXT,
  new_plan_name TEXT,
  change_type TEXT NOT NULL, -- 'upgrade', 'downgrade', 'new_subscription', 'cancellation'
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_changes
CREATE POLICY "Users can view their own subscription changes"
ON public.subscription_changes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription changes"
ON public.subscription_changes
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert subscription changes"
ON public.subscription_changes
FOR INSERT
WITH CHECK (true);

-- 4. Inserir novos planos de assinatura mensal
INSERT INTO public.token_packages (
  name, 
  tokens_amount, 
  price_brl, 
  description, 
  checkout_url, 
  package_type, 
  is_recurring, 
  is_active
) VALUES 
  (
    'Start', 
    100000, 
    97.00, 
    'Plano mensal Start - 100 mil tokens por mês', 
    'https://clkdmg.site/subscribe/iacopychief-start', 
    'subscription', 
    true, 
    true
  ),
  (
    'Gold', 
    250000, 
    197.00, 
    'Plano mensal Gold - 250 mil tokens por mês', 
    'https://clkdmg.site/subscribe/iacopychief-gold', 
    'subscription', 
    true, 
    true
  ),
  (
    'Diamond', 
    1000000, 
    397.00, 
    'Plano mensal Diamond - 1 milhão de tokens por mês', 
    'https://clkdmg.site/subscribe/iacopychief-diamond', 
    'subscription', 
    true, 
    true
  );

-- 5. Atualizar função reset_monthly_tokens para considerar planos de assinatura
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar tokens mensais baseado no plano de assinatura do usuário
  UPDATE public.profiles 
  SET 
    monthly_tokens = CASE 
      WHEN subscription_plan_name = 'Start' THEN 100000
      WHEN subscription_plan_name = 'Gold' THEN 250000
      WHEN subscription_plan_name = 'Diamond' THEN 1000000
      ELSE 100000 -- Padrão para usuários sem plano específico
    END,
    total_tokens_used = 0, -- Reset do uso mensal
    tokens_reset_date = CURRENT_DATE,
    notified_90 = false,
    notified_50 = false,
    notified_10 = false
  WHERE tokens_reset_date < CURRENT_DATE;
END;
$$;

-- 6. Criar função para processar assinatura de plano
CREATE OR REPLACE FUNCTION public.process_subscription_plan(
  p_user_id UUID,
  p_plan_name TEXT,
  p_digital_guru_order_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_package_id UUID;
  v_tokens_amount INTEGER;
  v_old_plan_name TEXT;
  v_old_plan_id UUID;
BEGIN
  -- Buscar o pacote de assinatura pelo nome
  SELECT id, tokens_amount INTO v_package_id, v_tokens_amount
  FROM public.token_packages
  WHERE name = p_plan_name 
    AND package_type = 'subscription' 
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE WARNING 'Plano de assinatura não encontrado: %', p_plan_name;
    RETURN FALSE;
  END IF;

  -- Obter plano atual do usuário
  SELECT subscription_plan_id, subscription_plan_name 
  INTO v_old_plan_id, v_old_plan_name
  FROM public.profiles
  WHERE id = p_user_id;

  -- Atualizar o plano do usuário
  UPDATE public.profiles
  SET 
    subscription_plan_id = v_package_id,
    subscription_plan_name = p_plan_name,
    monthly_tokens = v_tokens_amount,
    total_tokens_used = 0, -- Reset tokens mensais
    subscription_status = 'active',
    payment_approved_at = now(),
    subscription_expires_at = (now() + interval '1 month'),
    updated_at = now()
  WHERE id = p_user_id;

  -- Registrar mudança de plano para auditoria
  INSERT INTO public.subscription_changes (
    user_id,
    old_plan_id,
    new_plan_id,
    old_plan_name,
    new_plan_name,
    change_type
  ) VALUES (
    p_user_id,
    v_old_plan_id,
    v_package_id,
    v_old_plan_name,
    p_plan_name,
    CASE 
      WHEN v_old_plan_name IS NULL THEN 'new_subscription'
      WHEN v_old_plan_name != p_plan_name THEN 'plan_change'
      ELSE 'renewal'
    END
  );

  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro ao processar plano de assinatura: %', SQLERRM;
    RETURN FALSE;
END;
$$;