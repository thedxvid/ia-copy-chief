
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Rate limiting global para webhooks (100 requests por minuto)
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`webhook:${clientIP}`, 100, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // Obter e sanitizar dados do webhook
    const rawBody = await req.json();
    const body = sanitizeInput(rawBody);

    console.log('Webhook recebido:', body);

    // Validar estrutura básica do webhook
    if (!body.event || !body.order || !body.order.id) {
      return createErrorResponse('Invalid webhook payload', 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Registrar webhook para auditoria
    const { error: webhookError } = await supabase
      .from('kiwify_webhooks')
      .insert({
        event_type: body.event,
        kiwify_order_id: body.order.id,
        customer_email: body.order.Customer?.email || '',
        customer_id: body.order.Customer?.id || null,
        status: body.order.order_status || '',
        raw_data: body,
        processed: false
      });

    if (webhookError) {
      console.error('Erro ao registrar webhook:', webhookError);
    }

    // Processar apenas eventos de pagamento aprovado
    if (body.event === 'order_paid' && body.order.order_status === 'paid') {
      const customerEmail = body.order.Customer?.email;
      
      if (!customerEmail) {
        return createErrorResponse('Customer email not found', 400);
      }

      // Buscar usuário pelo email de forma segura
      const { data: user, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Erro ao buscar usuários:', userError);
        return createErrorResponse('Error processing payment', 500);
      }

      const targetUser = user.users.find(u => u.email === customerEmail);

      if (targetUser) {
        // Atualizar status da assinatura de forma segura
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            kiwify_customer_id: body.order.Customer.id,
            payment_approved_at: new Date().toISOString(),
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
          })
          .eq('id', targetUser.id);

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
          return createErrorResponse('Error updating user profile', 500);
        }

        // Marcar webhook como processado
        await supabase
          .from('kiwify_webhooks')
          .update({ processed: true })
          .eq('kiwify_order_id', body.order.id);

        console.log(`Assinatura ativada para: ${customerEmail}`);
      } else {
        console.log(`Usuário não encontrado para email: ${customerEmail}`);
      }
    }

    return createSecureResponse({ success: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
