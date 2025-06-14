
-- Adicionar campos na tabela profiles para controle de tokens
ALTER TABLE public.profiles ADD COLUMN monthly_tokens INTEGER DEFAULT 100000;
ALTER TABLE public.profiles ADD COLUMN extra_tokens INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN tokens_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN total_tokens_used INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN notified_90 BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN notified_50 BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN notified_10 BOOLEAN DEFAULT false;

-- Nova tabela para histórico de uso de tokens
CREATE TABLE public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tokens_used INTEGER NOT NULL,
  feature_used VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Nova tabela para compras de tokens
CREATE TABLE public.token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tokens_purchased INTEGER NOT NULL,
  amount_paid DECIMAL(10,2),
  payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para token_usage
CREATE POLICY "Users can view their own token usage" 
  ON public.token_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert token usage" 
  ON public.token_usage 
  FOR INSERT 
  WITH CHECK (true);

-- Políticas RLS para token_purchases
CREATE POLICY "Users can view their own token purchases" 
  ON public.token_purchases 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert token purchases" 
  ON public.token_purchases 
  FOR INSERT 
  WITH CHECK (true);

-- Função para reset mensal de tokens
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Função para consumir tokens
CREATE OR REPLACE FUNCTION public.consume_tokens(
  p_user_id UUID,
  p_tokens_used INTEGER,
  p_feature_used VARCHAR(100),
  p_prompt_tokens INTEGER DEFAULT 0,
  p_completion_tokens INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
  extra_tokens_used INTEGER := 0;
  monthly_tokens_used INTEGER := 0;
  remaining_tokens INTEGER;
BEGIN
  -- Buscar perfil do usuário
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se tem tokens suficientes
  IF (user_profile.monthly_tokens + user_profile.extra_tokens) < p_tokens_used THEN
    RETURN FALSE;
  END IF;
  
  remaining_tokens := p_tokens_used;
  
  -- Usar tokens extras primeiro
  IF user_profile.extra_tokens > 0 THEN
    extra_tokens_used := LEAST(user_profile.extra_tokens, remaining_tokens);
    remaining_tokens := remaining_tokens - extra_tokens_used;
  END IF;
  
  -- Usar tokens mensais depois
  IF remaining_tokens > 0 THEN
    monthly_tokens_used := LEAST(user_profile.monthly_tokens, remaining_tokens);
  END IF;
  
  -- Atualizar perfil do usuário
  UPDATE public.profiles 
  SET 
    extra_tokens = extra_tokens - extra_tokens_used,
    monthly_tokens = monthly_tokens - monthly_tokens_used,
    total_tokens_used = total_tokens_used + p_tokens_used
  WHERE id = p_user_id;
  
  -- Registrar uso
  INSERT INTO public.token_usage (
    user_id, 
    tokens_used, 
    feature_used, 
    prompt_tokens, 
    completion_tokens, 
    total_tokens
  ) VALUES (
    p_user_id, 
    p_tokens_used, 
    p_feature_used, 
    p_prompt_tokens, 
    p_completion_tokens, 
    p_tokens_used
  );
  
  RETURN TRUE;
END;
$$;

-- Função para verificar tokens disponíveis
CREATE OR REPLACE FUNCTION public.get_available_tokens(p_user_id UUID)
RETURNS TABLE(
  monthly_tokens INTEGER,
  extra_tokens INTEGER,
  total_available INTEGER,
  total_used INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.monthly_tokens,
    p.extra_tokens,
    (p.monthly_tokens + p.extra_tokens) as total_available,
    p.total_tokens_used
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$;
