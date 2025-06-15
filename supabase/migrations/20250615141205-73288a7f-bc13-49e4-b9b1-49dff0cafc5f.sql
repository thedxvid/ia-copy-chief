
-- Adicionar campos de subscription na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS kiwify_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- Criar tabela para logs de webhooks Kiwify
CREATE TABLE IF NOT EXISTS public.kiwify_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  kiwify_order_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_id TEXT,
  status TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS para kiwify_webhooks
ALTER TABLE public.kiwify_webhooks ENABLE ROW LEVEL SECURITY;

-- Política para administradores poderem ver webhooks
CREATE POLICY "Admins can view all webhooks" ON public.kiwify_webhooks
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      -- Permitir admins (você pode ajustar este critério)
      full_name ILIKE '%admin%' OR 
      avatar_url ILIKE '%admin%'
    )
  ));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_kiwify_webhooks_order_id ON public.kiwify_webhooks(kiwify_order_id);
CREATE INDEX IF NOT EXISTS idx_kiwify_webhooks_customer_email ON public.kiwify_webhooks(customer_email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_kiwify_customer_id ON public.profiles(kiwify_customer_id);
