
-- 1. Corrigir Function Search Path Mutable - Definir search_path seguro para todas as funções

-- Recriar função update_session_message_count com search_path seguro
CREATE OR REPLACE FUNCTION public.update_session_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chat_sessions 
    SET message_count = message_count + 1,
        updated_at = now()
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chat_sessions 
    SET message_count = message_count - 1,
        updated_at = now()
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Recriar função update_updated_at_column com search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recriar função reset_monthly_tokens com search_path seguro
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

-- Recriar função generate_session_title com search_path seguro
CREATE OR REPLACE FUNCTION public.generate_session_title()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $function$
BEGIN
  IF NEW.role = 'user' AND (
    SELECT title FROM public.chat_sessions WHERE id = NEW.session_id
  ) IS NULL THEN
    UPDATE public.chat_sessions 
    SET title = CASE 
      WHEN length(NEW.content) > 50 
      THEN substring(NEW.content from 1 for 47) || '...'
      ELSE NEW.content
    END
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recriar função consume_tokens com search_path seguro
CREATE OR REPLACE FUNCTION public.consume_tokens(p_user_id uuid, p_tokens_used integer, p_feature_used character varying, p_prompt_tokens integer DEFAULT 0, p_completion_tokens integer DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
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
$function$;

-- Recriar função get_available_tokens com search_path seguro
CREATE OR REPLACE FUNCTION public.get_available_tokens(p_user_id uuid)
RETURNS TABLE(monthly_tokens integer, extra_tokens integer, total_available integer, total_used integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
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
$function$;

-- Recriar função handle_new_user com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$function$;

-- Recriar função is_user_admin com search_path seguro
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id),
    false
  );
$function$;

-- 2. Verificar e garantir que todas as tabelas tenham RLS habilitado
-- Verificando tabelas que podem não ter RLS

-- Habilitar RLS em tabelas que podem não ter
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS mais restritivas para tabelas sem políticas adequadas

-- Políticas para chat_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;

CREATE POLICY "Users can view their own messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas para chat_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.chat_sessions;

CREATE POLICY "Users can view their own sessions" 
  ON public.chat_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
  ON public.chat_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.chat_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
  ON public.chat_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para token_usage
DROP POLICY IF EXISTS "Users can view their own token usage" ON public.token_usage;

CREATE POLICY "Users can view their own token usage" 
  ON public.token_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Políticas para token_purchases
DROP POLICY IF EXISTS "Users can view their own token purchases" ON public.token_purchases;

CREATE POLICY "Users can view their own token purchases" 
  ON public.token_purchases 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. Adicionar índices para melhorar performance de consultas de segurança
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON public.token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 5. Criar função para rate limiting (exemplo básico)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_id uuid,
  action_type text,
  max_requests integer DEFAULT 10,
  time_window interval DEFAULT '1 minute'::interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  request_count integer;
BEGIN
  -- Contar requests recentes
  SELECT COUNT(*) INTO request_count
  FROM public.token_usage
  WHERE user_id = check_rate_limit.user_id
    AND feature_used = action_type
    AND created_at > (now() - time_window);
  
  -- Retornar se está dentro do limite
  RETURN request_count < max_requests;
END;
$function$;
