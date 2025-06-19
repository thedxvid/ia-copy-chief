
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Função para gerar senha temporária segura
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para extrair nome do email
function extractNameFromEmail(email: string): string {
  const username = email.split('@')[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
}

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

    console.log('🎯 Webhook Kiwify recebido:', {
      event: body.event,
      orderId: body.order?.id,
      customerEmail: body.order?.Customer?.email,
      status: body.order?.order_status
    });

    // Validar estrutura básica do webhook
    if (!body.event || !body.order || !body.order.id) {
      console.error('❌ Estrutura inválida do webhook:', body);
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
      console.error('❌ Erro ao registrar webhook:', webhookError);
    }

    // Processar apenas eventos de pagamento aprovado
    if (body.event === 'order_paid' && body.order.order_status === 'paid') {
      const customerEmail = body.order.Customer?.email;
      
      if (!customerEmail) {
        console.error('❌ Email do cliente não encontrado');
        return createErrorResponse('Customer email not found', 400);
      }

      console.log('💰 Processando pagamento aprovado para:', customerEmail);

      // Buscar usuário pelo email de forma segura
      const { data: user, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ Erro ao buscar usuários:', userError);
        return createErrorResponse('Error processing payment', 500);
      }

      const targetUser = user.users.find(u => u.email === customerEmail);

      if (targetUser) {
        // FLUXO EXISTENTE: Usuário já existe, apenas ativar assinatura
        console.log('👤 Usuário existente encontrado, ativando assinatura');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            kiwify_customer_id: body.order.Customer.id,
            payment_approved_at: new Date().toISOString(),
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', targetUser.id);

        if (profileError) {
          console.error('❌ Erro ao atualizar perfil existente:', profileError);
          return createErrorResponse('Error updating user profile', 500);
        }

        console.log('✅ Assinatura ativada para usuário existente:', customerEmail);
        
      } else {
        // NOVO FLUXO: Usuário não existe, criar conta e enviar credenciais
        console.log('🆕 Novo usuário detectado, criando conta');
        
        const temporaryPassword = generateTemporaryPassword();
        const customerName = extractNameFromEmail(customerEmail);
        
        console.log('🔐 Senha temporária gerada:', temporaryPassword);
        
        try {
          // Criar novo usuário
          const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            password: temporaryPassword,
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
              full_name: customerName,
              is_kiwify_user: true,
              kiwify_order_id: body.order.id
            }
          });

          if (createUserError) {
            console.error('❌ Erro ao criar usuário:', createUserError);
            return createErrorResponse('Error creating user account', 500);
          }

          console.log('✅ Usuário criado com sucesso:', newUser.user.id);

          // Atualizar perfil do novo usuário
          const { error: newProfileError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              kiwify_customer_id: body.order.Customer.id,
              payment_approved_at: new Date().toISOString(),
              subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              first_login: true // Marcar para alterar senha no primeiro login
            })
            .eq('id', newUser.user.id);

          if (newProfileError) {
            console.error('❌ Erro ao atualizar perfil do novo usuário:', newProfileError);
            // Continuar mesmo com erro, o importante é que o usuário foi criado
          }

          // Enviar email com credenciais
          console.log('📧 Enviando email com credenciais');
          
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-credentials-email', {
            body: {
              email: customerEmail,
              name: customerName,
              temporaryPassword: temporaryPassword,
              isNewUser: true
            }
          });

          if (emailError) {
            console.error('❌ Erro ao enviar email:', emailError);
            // Não retornar erro aqui, pois o usuário foi criado com sucesso
          } else {
            console.log('✅ Email enviado com sucesso:', emailData);
          }

          console.log('🎉 Fluxo completo executado para novo usuário:', customerEmail);
          
        } catch (error) {
          console.error('❌ Erro crítico no fluxo de novo usuário:', error);
          return createErrorResponse('Error in new user flow', 500);
        }
      }

      // Marcar webhook como processado
      await supabase
        .from('kiwify_webhooks')
        .update({ processed: true })
        .eq('kiwify_order_id', body.order.id);

      console.log('✅ Webhook processado com sucesso');
    } else {
      console.log('ℹ️ Evento ignorado:', body.event, 'Status:', body.order?.order_status);
    }

    return createSecureResponse({ 
      success: true,
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('💥 Erro crítico no webhook:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
