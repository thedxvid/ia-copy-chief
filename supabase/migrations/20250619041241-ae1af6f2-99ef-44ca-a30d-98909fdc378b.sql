
-- Habilitar realtime para as tabelas de tokens
ALTER TABLE public.token_usage REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Criar função para notificar mudanças de tokens
CREATE OR REPLACE FUNCTION notify_token_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar mudança via NOTIFY
  PERFORM pg_notify(
    'token_update',
    json_build_object(
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para notificar mudanças
CREATE TRIGGER token_usage_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_change();

CREATE TRIGGER profiles_token_notify
  AFTER UPDATE OF monthly_tokens, extra_tokens, total_tokens_used ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_change();
