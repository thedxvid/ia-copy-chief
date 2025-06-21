
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

// Função para registrar eventos de pagamento na auditoria
async function logPaymentEvent(supabase: any, body: any) {
  try {
    console.log('📝 Registrando evento de pagamento na auditoria...');
    const { error: auditError } = await supabase
      .from('digital_guru_webhooks')
      .insert({
        event_type: body.event || 'payment_event',
        subscription_id: body.subscription_id || body.customer?.id || 'unknown',
        subscriber_email: body.customer?.email || '',
        subscriber_id: body.customer?.id || null,
        subscription_status: body.event || 'unknown',
        webhook_type: 'payment_event',
        raw_data: body,
        processed: false
      });

    if (auditError) {
      console.error('❌ Erro ao registrar evento na auditoria:', auditError);
    } else {
      console.log('✅ Evento de pagamento registrado na auditoria');
    }
  } catch (error) {
    console.error('❌ Erro crítico ao registrar auditoria:', error);
  }
}

// Função otimizada para envio de e-mail em background
async function sendEmailInBackground(userEmail: string, statusReason: string, newStatus: string) {
  try {
    console.log('📧 Iniciando envio de e-mail em background...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: emailError } = await supabase.functions.invoke('send-checkout-email', {
      body: {
        email: userEmail,
        reason: statusReason,
        newStatus: newStatus,
        isStatusChange: true
      }
    });

    if (emailError) {
      console.warn('⚠️ Falha ao enviar email de notificação:', emailError);
    } else {
      console.log('✅ Email de notificação enviado com sucesso');
    }
  } catch (emailError) {
    console.warn('⚠️ Erro ao tentar enviar email:', emailError);
  }
}

serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 WEBHOOK PAYMENT EVENT HANDLER INICIADO - ${timestamp}`);
  console.log('📊 Método:', req.method);
  console.log('🌐 URL:', req.url);

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
        message: 'Payment Event Handler webhook is active and running',
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

    console.log('🎯 Evento de pagamento processado:', {
      eventType: body.event,
      customerEmail: body.customer?.email,
      subscriptionId: body.subscription_id || body.customer?.id
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Registrar evento para auditoria em paralelo (não bloquear)
    EdgeRuntime.waitUntil(logPaymentEvent(supabase, body));

    // Extrair dados do payload
    const eventType = body.event;
    const userEmail = body.customer?.email;
    const subscriptionId = body.subscription_id || body.customer?.id;

    // Validações obrigatórias
    if (!eventType) {
      console.error('❌ Tipo de evento não encontrado no payload');
      return new Response(
        JSON.stringify({ error: 'Event type is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (!userEmail) {
      console.error('❌ Email do cliente não encontrado no payload');
      return new Response(
        JSON.stringify({ error: 'Customer email is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('⚡ Processamento rápido iniciado para:', userEmail);

    // Buscar usuário pelo email
    console.log('🔍 Buscando usuário por email:', userEmail);
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

    const targetUser = users.users.find(u => u.email === userEmail);

    if (!targetUser) {
      console.error('❌ Usuário não encontrado:', userEmail);
      return new Response(
        JSON.stringify({ error: 'User not found' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('👤 Usuário encontrado:', targetUser.id);

    // Determinar novo status baseado no tipo de evento
    let newStatus = 'inactive';
    let statusReason = '';

    switch (eventType) {
      case 'payment_failed':
      case 'payment_declined':
      case 'subscription_payment_failed':
        newStatus = 'past_due';
        statusReason = 'Pagamento falhou ou foi recusado';
        break;
      
      case 'subscription_canceled':
      case 'subscription_cancelled':
      case 'user_canceled':
        newStatus = 'canceled';
        statusReason = 'Assinatura cancelada pelo usuário ou sistema';
        break;
      
      case 'subscription_expired':
      case 'subscription_ended':
        newStatus = 'inactive';
        statusReason = 'Assinatura expirou';
        break;
      
      case 'chargeback':
      case 'refund':
        newStatus = 'canceled';
        statusReason = 'Chargeback ou reembolso processado';
        break;
      
      default:
        console.log('⚠️ Tipo de evento não mapeado:', eventType);
        newStatus = 'inactive';
        statusReason = `Evento não mapeado: ${eventType}`;
    }

    console.log('🔄 Atualizando status do usuário:', {
      userId: targetUser.id,
      from: 'active (presumido)',
      to: newStatus,
      reason: statusReason
    });

    // Atualizar status do usuário para bloquear o acesso
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: newStatus,
        payment_approved_at: null, // Limpar data de aprovação
        subscription_expires_at: new Date().toISOString() // Definir como expirado agora
      })
      .eq('id', targetUser.id);

    if (updateError) {
      console.error(`❌ Erro ao atualizar status do usuário ${targetUser.id} para ${newStatus}:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Error updating user subscription status' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log(`✅ Status do usuário atualizado para ${newStatus}`);

    // Marcar evento como processado em background
    EdgeRuntime.waitUntil(
      supabase
        .from('digital_guru_webhooks')
        .update({ processed: true })
        .eq('subscriber_email', userEmail)
        .eq('processed', false)
    );

    // Enviar email de notificação em background (não bloquear resposta)
    EdgeRuntime.waitUntil(sendEmailInBackground(userEmail, statusReason, newStatus));

    console.log('🎉 EVENTO DE PAGAMENTO PROCESSADO COM SUCESSO (OTIMIZADO)');
    console.log('📊 Resumo:');
    console.log('  - Email:', userEmail);
    console.log('  - Evento:', eventType);
    console.log('  - Novo Status:', newStatus);
    console.log('  - Motivo:', statusReason);
    console.log('  - Processamento: RÁPIDO (email em background)');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment event processed successfully (optimized)',
        eventType: eventType,
        userEmail: userEmail,
        newStatus: newStatus,
        reason: statusReason,
        userId: targetUser.id,
        processingTime: 'optimized'
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NO WEBHOOK DE EVENTOS DE PAGAMENTO:', error);
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
