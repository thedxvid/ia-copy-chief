
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400'
};

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
  console.log('🚀 WEBHOOK KIWIFY INICIADO - Método:', req.method);
  console.log('🔗 Headers recebidos:', Object.fromEntries(req.headers.entries()));

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo a requisição OPTIONS (CORS)');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Obter dados do webhook
    const rawBody = await req.text();
    console.log('📦 Raw body recebido:', rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('🎯 Webhook Kiwify processado:', {
      event: body.event,
      orderId: body.order?.id,
      customerEmail: body.order?.Customer?.email,
      status: body.order?.order_status,
      fullPayload: body
    });

    // Validar estrutura básica do webhook
    if (!body.event || !body.order || !body.order.id) {
      console.error('❌ Estrutura inválida do webhook:', body);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload structure' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Registrar webhook para auditoria
    console.log('📝 Registrando webhook na tabela de auditoria...');
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
    } else {
      console.log('✅ Webhook registrado com sucesso na auditoria');
    }

    // Processar apenas eventos de pagamento aprovado
    if (body.event === 'order_paid' && body.order.order_status === 'paid') {
      const customerEmail = body.order.Customer?.email;
      
      if (!customerEmail) {
        console.error('❌ Email do cliente não encontrado');
        return new Response(
          JSON.stringify({ error: 'Customer email not found' }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      console.log('💰 Processando pagamento aprovado para:', customerEmail);

      // Buscar usuário pelo email de forma segura
      console.log('🔍 Buscando usuário no banco...');
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ Erro ao buscar usuários:', userError);
        return new Response(
          JSON.stringify({ error: 'Error searching for user' }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      const targetUser = users.users.find(u => u.email === customerEmail);

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
          return new Response(
            JSON.stringify({ error: 'Error updating existing user profile' }), 
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            }
          );
        }

        console.log('✅ Assinatura ativada para usuário existente:', customerEmail);
        
      } else {
        // NOVO FLUXO: Usuário não existe, criar conta e enviar credenciais
        console.log('🆕 Novo usuário detectado, criando conta');
        
        const temporaryPassword = generateTemporaryPassword();
        const customerName = extractNameFromEmail(customerEmail);
        
        console.log('🔐 Senha temporária gerada:', temporaryPassword);
        console.log('👤 Nome extraído do email:', customerName);
        
        try {
          // Criar novo usuário
          console.log('🔨 Criando novo usuário no Supabase Auth...');
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
            return new Response(
              JSON.stringify({ error: 'Error creating user account', details: createUserError }), 
              { 
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              }
            );
          }

          console.log('✅ Usuário criado com sucesso:', newUser.user?.id);

          // Atualizar perfil do novo usuário
          console.log('📝 Atualizando perfil do novo usuário...');
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
          } else {
            console.log('✅ Perfil do novo usuário atualizado com sucesso');
          }

          // Enviar email com credenciais
          console.log('📧 Enviando email com credenciais...');
          
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
            console.log('⚠️ Usuário criado mas email falhou - usuário pode fazer login normalmente');
          } else {
            console.log('✅ Email enviado com sucesso:', emailData);
          }

          console.log('🎉 Fluxo completo executado para novo usuário:', customerEmail);
          
        } catch (error) {
          console.error('❌ Erro crítico no fluxo de novo usuário:', error);
          return new Response(
            JSON.stringify({ error: 'Critical error in new user flow', details: error }), 
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            }
          );
        }
      }

      // Marcar webhook como processado
      console.log('✔️ Marcando webhook como processado...');
      await supabase
        .from('kiwify_webhooks')
        .update({ processed: true })
        .eq('kiwify_order_id', body.order.id);

      console.log('✅ Webhook processado com sucesso - FINALIZANDO');
    } else {
      console.log('ℹ️ Evento ignorado:', body.event, 'Status:', body.order?.order_status);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        processed: body.event === 'order_paid' && body.order?.order_status === 'paid' 
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('💥 Erro crítico no webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
