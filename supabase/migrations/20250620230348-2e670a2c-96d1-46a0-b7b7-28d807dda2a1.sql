
-- Criar tabela para webhooks do Digital Guru Manager
CREATE TABLE public.digital_guru_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  event_type TEXT NOT NULL DEFAULT 'subscription',
  subscription_id TEXT NOT NULL,
  subscriber_email TEXT NOT NULL,
  subscriber_id TEXT,
  subscription_status TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  api_token TEXT
);

-- Adicionar índices para melhor performance
CREATE INDEX idx_digital_guru_webhooks_subscription_id ON public.digital_guru_webhooks(subscription_id);
CREATE INDEX idx_digital_guru_webhooks_subscriber_email ON public.digital_guru_webhooks(subscriber_email);
CREATE INDEX idx_digital_guru_webhooks_processed ON public.digital_guru_webhooks(processed);
CREATE INDEX idx_digital_guru_webhooks_created_at ON public.digital_guru_webhooks(created_at);

-- Habilitar RLS para segurança
ALTER TABLE public.digital_guru_webhooks ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserções do webhook (função será pública)
CREATE POLICY "Allow webhook inserts" ON public.digital_guru_webhooks
  FOR INSERT WITH CHECK (true);

-- Política para permitir que admins vejam todos os webhooks
CREATE POLICY "Admin can view all webhooks" ON public.digital_guru_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
