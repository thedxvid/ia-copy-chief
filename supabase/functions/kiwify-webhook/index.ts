
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

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para registrar webhook na auditoria
async function logWebhookToAudit(supabase: any, body: any) {
  try {
    console.log('📝 Registrando webhook na tabela de auditoria...');
    const { error: webhookError } = await supabase
      .from('kiwify_webhooks')
      .insert({
        event_type: body.webhook_event_type || body.event || 'unknown',
        kiwify_order_id: body.order_id || body.order?.id || 'unknown',
        customer_email: body.Customer?.email || body.order?.Customer?.email || '',
        customer_id: body.Customer?.id || body.order?.Customer?.id || null,
        status: body.order_status || body.order?.order_status || 'unknown',
        raw_data: body,
        processed: false
      });

    if (webhookError) {
      console.error('❌ Erro ao registrar webhook na auditoria:', webhookError);
    } else {
      console.log('✅ Webhook registrado com sucesso na auditoria');
    }
  } catch (error) {
    console.error('❌ Erro crítico ao registrar auditoria:', error);
  }
}

// Função para verificar se webhook já foi processado
async function checkDuplicateWebhook(supabase: any, orderId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('kiwify_webhooks')
      .select('id, processed')
      .eq('kiwify_order_id', orderId)
      .eq('processed', true)
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar webhook duplicado:', error);
      return false;
    }

    const isDuplicate = data && data.length > 0;
    if (isDuplicate) {
      console.log('⚠️ Webhook duplicado detectado para order:', orderId);
    }
    
    return isDuplicate;
  } catch (error) {
    console.error('❌ Erro ao verificar duplicação:', error);
    return false;
  }
}

serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 WEBHOOK KIWIFY INICIADO - ${timestamp}`);
  console.log('📊 Método:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('🔗 Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo a requisição OPTIONS (CORS)');
    return new Response('ok', { headers: corsHeaders })
  }

  // Endpoint de teste GET
  if (req.method === 'GET') {
    console.log('🧪 Endpoint de teste acessado');
    return new Response(
      JSON.stringify({ 
        status: 'OK', 
        message: 'Kiwify webhook is active and running',
        timestamp: timestamp
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
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
    console.log('📦 Raw body recebido (tamanho):', rawBody.length);
    console.log('📦 Raw body preview:', rawBody.substring(0, 500) + '...');

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

    console.log('🎯 Webhook processado com campos:', Object.keys(body));
    console.log('📧 Event type:', body.webhook_event_type || body.event);
    console.log('🆔 Order ID:', body.order_id || body.order?.id);
    console.log('📊 Order status:', body.order_status || body.order?.order_status);
    console.log('👤 Customer email:', body.Customer?.email || body.order?.Customer?.email);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Registrar webhook para auditoria SEMPRE
    await logWebhookToAudit(supabase, body);

    // Validar estrutura do webhook - adaptada para diferentes formatos
    const orderId = body.order_id || body.order?.id;
    const customerEmail = body.Customer?.email || body.order?.Customer?.email;
    const eventType = body.webhook_event_type || body.event;
    const orderStatus = body.order_status || body.order?.order_status;

    console.log('🔍 Dados extraídos:');
    console.log('  - Order ID:', orderId);
    console.log('  - Customer Email:', customerEmail);
    console.log('  - Event Type:', eventType);
    console.log('  - Order Status:', orderStatus);

    // Validações obrigatórias
    const validationErrors = [];
    
    if (!orderId) {
      validationErrors.push('Order ID is missing');
    }
    
    if (!customerEmail) {
      validationErrors.push('Customer email is missing');
    } else if (!isValidEmail(customerEmail)) {
      validationErrors.push('Customer email format is invalid');
    }
    
    if (!eventType) {
      validationErrors.push('Event type is missing');
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validação falhou:', validationErrors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationErrors,
          received_data: {
            orderId,
            customerEmail,
            eventType,
            orderStatus
          }
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Verificar webhook duplicado
    const isDuplicate = await checkDuplicateWebhook(supabase, orderId);
    if (isDuplicate) {
      console.log('⚠️ Webhook duplicado ignorado para order:', orderId);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook already processed (duplicate)',
          orderId: orderId
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Processar apenas eventos de pagamento aprovado
    const shouldProcess = (
      (eventType === 'order_paid' && orderStatus === 'paid') ||
      (eventType === 'order_approved' && orderStatus === 'paid')
    );

    if (shouldProcess) {
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
        console.log('👤 Usuário existente encontrado:', targetUser.id);
        console.log('📝 Ativando assinatura para usuário existente...');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            kiwify_customer_id: body.Customer?.id || body.order?.Customer?.id,
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
        console.log('🆕 Novo usuário detectado, iniciando criação de conta...');
        
        const temporaryPassword = generateTemporaryPassword();
        const customerName = extractNameFromEmail(customerEmail);
        
        console.log('🔐 Senha temporária gerada para:', customerEmail);
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
              kiwify_order_id: orderId
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
              kiwify_customer_id: body.Customer?.id || body.order?.Customer?.id,
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
            console.log('✅ Email enviado com sucesso');
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
        .eq('kiwify_order_id', orderId);

      console.log('✅ WEBHOOK PROCESSADO COM SUCESSO');
      console.log('📊 Resumo da ativação:');
      console.log('  - Email:', customerEmail);
      console.log('  - Order ID:', orderId);
      console.log('  - Usuário:', targetUser ? 'Existente' : 'Novo');
      console.log('  - Status:', 'Assinatura Ativada');

    } else {
      console.log('ℹ️ Evento ignorado:');
      console.log('  - Event Type:', eventType);
      console.log('  - Order Status:', orderStatus);
      console.log('  - Motivo: Não é um pagamento aprovado');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        processed: shouldProcess,
        orderId: orderId,
        customerEmail: customerEmail,
        eventType: eventType,
        orderStatus: orderStatus
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NO WEBHOOK:', error);
    console.error('📍 Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: timestamp
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
