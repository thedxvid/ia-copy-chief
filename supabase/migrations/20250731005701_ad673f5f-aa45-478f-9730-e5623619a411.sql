-- Atualizar as datas de expiração para os usuários afetados
-- Adicionar 30 dias a partir de hoje para usuários com status active mas data expirada

UPDATE profiles 
SET subscription_expires_at = (CURRENT_DATE + INTERVAL '30 days')::timestamp with time zone,
    updated_at = now()
WHERE subscription_status = 'active' 
AND subscription_expires_at < now()
AND id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('ryancarlocopy@gmail.com', 'mrmoisesrar@gmail.com')
);

-- Marcar o webhook pendente como processado para evitar conflitos futuros
UPDATE digital_guru_webhooks 
SET processed = true,
    raw_data = raw_data || '{"manual_fix": true, "fixed_at": "' || now()::text || '"}'
WHERE subscriber_email IN ('ryancarlocopy@gmail.com', 'mrmoisesrar@gmail.com')
AND processed = false;