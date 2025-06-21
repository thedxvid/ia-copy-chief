
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
    console.log('📝 Registrando webhook Digital Guru na tabela de auditoria...');
    const { error: webhookError } = await supabase
      .from('digital_guru_webhooks')
      .insert({
        event_type: body.webhook_type || 'subscription',
        subscription_id: body.id || body.subscription_code || 'unknown',
        subscriber_email: body.subscriber?.email || body.last_transaction?.contact?.email || '',
        subscriber_id: body.subscriber?.id || body.last_transaction?.contact?.id || null,
        subscription_status: body.last_status || 'unknown',
        webhook_type: body.webhook_type || 'subscription',
        raw_data: body,
        api_token: body.api_token || null,
        processed: false
      });

    if (webhookError) {
      console.error('❌ Erro ao registrar webhook na auditoria:', webhookError);
    } else {
      console.log('✅ Webhook Digital Guru registrado com sucesso na auditoria');
    }
  } catch (error) {
    console.error('❌ Erro crítico ao registrar auditoria:', error);
  }
}

// Função para verificar se webhook já foi processado
async function checkDuplicateWebhook(supabase: any, subscriptionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('digital_guru_webhooks')
      .select('id, processed')
      .eq('subscription_id', subscriptionId)
      .eq('processed', true)
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar webhook duplicado:', error);
      return false;
    }

    const isDuplicate = data && data.length > 0;
    if (isDuplicate) {
      console.log('⚠️ Webhook duplicado detectado para subscription:', subscriptionId);
    }
    
    return isDuplicate;
  } catch (error) {
    console.error('❌ Erro ao verificar duplicação:', error);
    return false;
  }
}

serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 WEBHOOK DIGITAL GURU MANAGER INICIADO - ${timestamp}`);
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
        message: 'Digital Guru Manager webhook is active and running',
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
    console.log('📧 Webhook type:', body.webhook_type);
    console.log('🆔 Subscription ID:', body.id || body.subscription_code);
    console.log('📊 Subscription status:', body.last_status);
    console.log('👤 Subscriber email:', body.subscriber?.email);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Registrar webhook para auditoria SEMPRE
    await logWebhookToAudit(supabase, body);

    // Validar estrutura do webhook
    const subscriptionId = body.id || body.subscription_code;
    const subscriberEmail = body.subscriber?.email || body.last_transaction?.contact?.email;
    const webhookType = body.webhook_type || 'subscription';
    const subscriptionStatus = body.last_status;

    console.log('🔍 Dados extraídos:');
    console.log('  - Subscription ID:', subscriptionId);
    console.log('  - Subscriber Email:', subscriberEmail);
    console.log('  - Webhook Type:', webhookType);
    console.log('  - Subscription Status:', subscriptionStatus);

    // Validações obrigatórias
    const validationErrors = [];
    
    if (!subscriptionId) {
      validationErrors.push('Subscription ID is missing');
    }
    
    if (!subscriberEmail) {
      validationErrors.push('Subscriber email is missing');
    } else if (!isValidEmail(subscriberEmail)) {
      validationErrors.push('Subscriber email format is invalid');
    }
    
    if (!webhookType) {
      validationErrors.push('Webhook type is missing');
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validação falhou:', validationErrors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationErrors,
          received_data: {
            subscriptionId,
            subscriberEmail,
            webhookType,
            subscriptionStatus
          }
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Verificar webhook duplicado
    const isDuplicate = await checkDuplicateWebhook(supabase, subscriptionId);
    if (isDuplicate) {
      console.log('⚠️ Webhook duplicado ignorado para subscription:', subscriptionId);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook already processed (duplicate)',
          subscriptionId: subscriptionId
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Processar apenas status de assinatura ativa
    const shouldProcess = (
      webhookType === 'subscription' && 
      (subscriptionStatus === 'active' || subscriptionStatus === 'approved')
    );

    if (shouldProcess) {
      console.log('💰 Processando assinatura ativa para:', subscriberEmail);

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

      const targetUser = users.users.find(u => u.email === subscriberEmail);

      if (targetUser) {
        // FLUXO EXISTENTE: Usuário já existe, ativar assinatura
        console.log('👤 Usuário existente encontrado:', targetUser.id);
        console.log('📝 Ativando assinatura para usuário existente...');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
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

        console.log('✅ Assinatura ativada para usuário existente:', subscriberEmail);
        
      } else {
        // NOVO FLUXO: Usuário não existe, criar conta e ativar assinatura
        console.log('🆕 Novo usuário detectado, iniciando criação de conta...');
        
        const temporaryPassword = generateTemporaryPassword();
        const customerName = body.subscriber?.name || extractNameFromEmail(subscriberEmail);
        
        console.log('🔐 Senha temporária gerada para:', subscriberEmail);
        console.log('👤 Nome extraído:', customerName);
        
        try {
          // Criar novo usuário
          console.log('🔨 Criando novo usuário no Supabase Auth...');
          const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: subscriberEmail,
            password: temporaryPassword,
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
              full_name: customerName,
              is_digital_guru_user: true,
              subscription_id: subscriptionId
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

          // Atualizar perfil do novo usuário COM ASSINATURA ATIVA
          console.log('📝 Atualizando perfil do novo usuário com assinatura ativa...');
          const { error: newProfileError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              payment_approved_at: new Date().toISOString(),
              subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              first_login: true // Marcar para alterar senha no primeiro login
            })
            .eq('id', newUser.user.id);

          if (newProfileError) {
            console.error('❌ Erro ao atualizar perfil do novo usuário:', newProfileError);
            // Continuar mesmo com erro, o importante é que o usuário foi criado
          } else {
            console.log('✅ Perfil do novo usuário atualizado com assinatura ATIVA');
          }

          // Enviar email com credenciais
          console.log('📧 Enviando email com credenciais...');
          
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-credentials-email', {
            body: {
              email: subscriberEmail,
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

          console.log('🎉 Fluxo completo executado para novo usuário:', subscriberEmail);
          
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
        .from('digital_guru_webhooks')
        .update({ processed: true })
        .eq('subscription_id', subscriptionId);

      console.log('✅ WEBHOOK DIGITAL GURU PROCESSADO COM SUCESSO');
      console.log('📊 Resumo da ativação:');
      console.log('  - Email:', subscriberEmail);
      console.log('  - Subscription ID:', subscriptionId);
      console.log('  - Usuário:', targetUser ? 'Existente' : 'Novo');
      console.log('  - Status:', 'Assinatura Ativada (active)');

    } else {
      console.log('ℹ️ Evento ignorado:');
      console.log('  - Webhook Type:', webhookType);
      console.log('  - Subscription Status:', subscriptionStatus);
      console.log('  - Motivo: Não é uma assinatura ativa');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Digital Guru webhook processed successfully',
        processed: shouldProcess,
        subscriptionId: subscriptionId,
        subscriberEmail: subscriberEmail,
        webhookType: webhookType,
        subscriptionStatus: subscriptionStatus
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NO WEBHOOK DIGITAL GURU:', error);
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
