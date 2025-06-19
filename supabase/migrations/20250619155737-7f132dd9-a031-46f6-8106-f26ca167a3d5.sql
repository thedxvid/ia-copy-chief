
-- 1. Primeiro, atualizar a função reset_monthly_tokens para usar 25.000 tokens
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    monthly_tokens = 25000,
    tokens_reset_date = CURRENT_DATE,
    notified_90 = false,
    notified_50 = false,
    notified_10 = false
  WHERE tokens_reset_date < CURRENT_DATE;
END;
$function$
