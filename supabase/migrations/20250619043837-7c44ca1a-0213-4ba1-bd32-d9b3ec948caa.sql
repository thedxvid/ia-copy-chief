
-- Corrigir o nome do usuário admin
UPDATE public.profiles 
SET full_name = 'Miguel' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@iacopychief.com'
);

-- Verificar se existem perfis sem full_name para debug
SELECT 
  p.id,
  p.full_name,
  au.email,
  p.monthly_tokens,
  p.extra_tokens,
  p.subscription_status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;
