
-- Corrigir a função notify_token_change para lidar com diferentes estruturas de tabelas
CREATE OR REPLACE FUNCTION public.notify_token_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Determinar o user_id baseado na tabela que está sendo modificada
  DECLARE
    v_user_id UUID;
  BEGIN
    -- Para a tabela profiles, o user_id é o próprio id
    IF TG_TABLE_NAME = 'profiles' THEN
      v_user_id := COALESCE(NEW.id, OLD.id);
    -- Para a tabela token_usage, usar o campo user_id diretamente
    ELSIF TG_TABLE_NAME = 'token_usage' THEN
      v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    -- Para outras tabelas, tentar usar user_id se existir
    ELSE
      v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    END IF;

    -- Notificar mudança via NOTIFY
    PERFORM pg_notify(
      'token_update',
      json_build_object(
        'user_id', v_user_id,
        'event', TG_OP,
        'table', TG_TABLE_NAME,
        'timestamp', extract(epoch from now())
      )::text
    );
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$;

-- Recriar os triggers com a função corrigida
DROP TRIGGER IF EXISTS token_usage_notify ON public.token_usage;
CREATE TRIGGER token_usage_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_change();

DROP TRIGGER IF EXISTS profiles_token_notify ON public.profiles;
CREATE TRIGGER profiles_token_notify
  AFTER UPDATE OF monthly_tokens, extra_tokens, total_tokens_used ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_change();
