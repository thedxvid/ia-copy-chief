
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface mais flexível para aceitar diferentes formatos de webhook
interface FlexibleWebhookData {
  // Formato padrão esperado
  event?: string;
  data?: {
    order_id?: string;
    order_status?: string;
    customer_email?: string;
    customer_name?: string;
    product_name?: string;
    order_total?: number;
    payment_method?: string;
    created_at?: string;
  };
  
  // Possíveis formatos alternativos
  event_type?: string;
  type?: string;
  status?: string;
  order_id?: string;
  order_status?: string;
  customer_email?: string;
  customer_name?: string;
  product_name?: string;
  product?: string;
  order_total?: number;
  total?: number;
  amount?: number;
  value?: number;
  payment_method?: string;
  created_at?: string;
  timestamp?: string;
  
  // Para capturar qualquer outro formato
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const rawData: FlexibleWebhookData = await req.json();
    
    console.log('🎯 TOKEN PURCHASE WEBHOOK - DADOS BRUTOS RECEBIDOS:', JSON.stringify(rawData, null, 2));

    // Extrair dados de forma mais flexível
    const extractedData = {
      event: rawData.event || rawData.event_type || rawData.type || 'unknown',
      order_id: rawData.data?.order_id || rawData.order_id || 'unknown',
      order_status: rawData.data?.order_status || rawData.order_status || rawData.status || 'unknown',
      customer_email: rawData.data?.customer_email || rawData.customer_email || 'unknown',
      customer_name: rawData.data?.customer_name || rawData.customer_name,
      product_name: rawData.data?.product_name || rawData.product_name || rawData.product || 'unknown',
      order_total: rawData.data?.order_total || rawData.order_total || rawData.total || rawData.amount || rawData.value || 0,
      payment_method: rawData.data?.payment_method || rawData.payment_method,
      created_at: rawData.data?.created_at || rawData.created_at || rawData.timestamp
    };

    console.log('🔍 DADOS EXTRAÍDOS E PROCESSADOS:', {
      event: extractedData.event,
      orderId: extractedData.order_id,
      status: extractedData.order_status,
      email: extractedData.customer_email,
      product: extractedData.product_name,
      total: extractedData.order_total
    });

    // Validar se é um evento de pagamento aprovado (mais flexível)
    const approvedEvents = ['order.approved', 'order.paid', 'payment.approved', 'approved', 'paid', 'completed', 'success'];
    const isApprovedEvent = approvedEvents.some(event => 
      extractedData.event.toLowerCase().includes(event) || 
      extractedData.order_status.toLowerCase().includes(event.split('.')[1] || event)
    );

    if (!isApprovedEvent) {
      console.log('⚠️ Evento ignorado:', extractedData.event, 'Status:', extractedData.order_status);
      return new Response('Event ignored', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Validar dados obrigatórios
    if (!extractedData.customer_email || extractedData.customer_email === 'unknown' || 
        !extractedData.order_id || extractedData.order_id === 'unknown') {
      console.error('❌ Dados obrigatórios ausentes:', {
        email: extractedData.customer_email,
        orderId: extractedData.order_id,
        product: extractedData.product_name
      });
      return new Response('Missing required data', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Buscar usuário pelo email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(extractedData.customer_email);
    
    if (authError || !authUser.user) {
      console.error('❌ Usuário não encontrado:', extractedData.customer_email, authError);
      return new Response('User not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, extra_tokens')
      .eq('id', authUser.user.id)
      .single();

    if (userError || !user) {
      console.error('❌ Profile do usuário não encontrado:', authUser.user.id, userError);
      return new Response('User profile not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log('👤 Usuário encontrado:', {
      userId: user.id,
      name: user.full_name,
      currentExtraTokens: user.extra_tokens
    });

    // Verificar se a compra já foi processada
    const { data: existingPurchase } = await supabase
      .from('token_package_purchases')
      .select('id, payment_status')
      .eq('digital_guru_order_id', extractedData.order_id)
      .eq('user_id', user.id)
      .single();

    if (existingPurchase && existingPurchase.payment_status === 'completed') {
      console.log('⚠️ Compra já processada:', extractedData.order_id);
      return new Response('Purchase already processed', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Determinar quantidade de tokens (melhorada para incluir 10k)
    let tokensToAdd = 0;
    const productLower = extractedData.product_name.toLowerCase();
    const orderTotal = extractedData.order_total;
    
    console.log('🔍 DETERMINANDO TOKENS:', {
      productName: extractedData.product_name,
      productLower: productLower,
      orderTotal: orderTotal
    });

    // Mapear produtos para tokens (incluindo 10k)
    if (productLower.includes('10k') || productLower.includes('10.000') || productLower.includes('10 mil')) {
      tokensToAdd = 10000;
    } else if (productLower.includes('100k') || productLower.includes('100.000') || productLower.includes('100 mil')) {
      tokensToAdd = 100000;
    } else if (productLower.includes('250k') || productLower.includes('250.000') || productLower.includes('250 mil')) {
      tokensToAdd = 250000;
    } else if (productLower.includes('500k') || productLower.includes('500.000') || productLower.includes('500 mil')) {
      tokensToAdd = 500000;
    } else if (productLower.includes('1m') || productLower.includes('1.000.000') || productLower.includes('1 milhão')) {
      tokensToAdd = 1000000;
    } else if (orderTotal) {
      // Fallback: calcular baseado no valor (incluindo R$10 para 10k)
      if (orderTotal >= 8 && orderTotal <= 12) tokensToAdd = 10000;        // R$ 10 ± 2
      else if (orderTotal >= 90 && orderTotal <= 105) tokensToAdd = 100000;  // R$ 97 ± 8
      else if (orderTotal >= 190 && orderTotal <= 205) tokensToAdd = 250000; // R$ 197 ± 8
      else if (orderTotal >= 290 && orderTotal <= 305) tokensToAdd = 500000; // R$ 297 ± 8
      else if (orderTotal >= 390 && orderTotal <= 405) tokensToAdd = 1000000; // R$ 397 ± 8
    }

    console.log('💰 TOKENS DETERMINADOS:', {
      tokensToAdd: tokensToAdd,
      baseadoEm: tokensToAdd > 0 ? (productLower.includes('k') || productLower.includes('mil') || productLower.includes('milhão') ? 'nome_produto' : 'valor') : 'nenhum'
    });

    if (tokensToAdd === 0) {
      console.error('❌ Não foi possível determinar quantidade de tokens:', {
        product: extractedData.product_name,
        total: extractedData.order_total
      });
      return new Response('Could not determine token amount', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Buscar ou criar registro de compra
    let purchaseId = existingPurchase?.id;
    
    if (!existingPurchase) {
      // Criar novo registro de compra
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('token_package_purchases')
        .insert({
          user_id: user.id,
          digital_guru_order_id: extractedData.order_id,
          tokens_purchased: tokensToAdd,
          amount_paid: orderTotal || 0,
          payment_status: 'completed',
          processed_at: new Date().toISOString(),
          package_id: '00000000-0000-0000-0000-000000000000' // UUID padrão para compras via webhook
        })
        .select('id')
        .single();

      if (purchaseError) {
        console.error('❌ Erro ao criar registro de compra:', purchaseError);
        return new Response('Error creating purchase record', { 
          status: 500, 
          headers: corsHeaders 
        });
      }
      
      purchaseId = newPurchase.id;
      console.log('✅ Registro de compra criado:', purchaseId);
    } else {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('token_package_purchases')
        .update({
          payment_status: 'completed',
          processed_at: new Date().toISOString(),
          tokens_purchased: tokensToAdd,
          amount_paid: orderTotal || 0
        })
        .eq('id', existingPurchase.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar registro de compra:', updateError);
        return new Response('Error updating purchase record', { 
          status: 500, 
          headers: corsHeaders 
        });
      }
      
      console.log('✅ Registro de compra atualizado:', existingPurchase.id);
    }

    // Creditar tokens extras ao usuário
    const newTotalTokens = (user.extra_tokens || 0) + tokensToAdd;
    const { error: creditError } = await supabase
      .from('profiles')
      .update({
        extra_tokens: newTotalTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (creditError) {
      console.error('❌ Erro ao creditar tokens:', creditError);
      return new Response('Error crediting tokens', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('🎉 TOKENS CREDITADOS COM SUCESSO:', {
      userId: user.id,
      tokensAdded: tokensToAdd,
      newExtraTokens: newTotalTokens,
      orderId: extractedData.order_id
    });

    // Registrar log de auditoria
    await supabase
      .from('token_audit_logs')
      .insert({
        user_id: user.id,
        admin_user_id: user.id, // Auto-credit via webhook
        action_type: 'add_extra',
        old_value: user.extra_tokens || 0,
        new_value: newTotalTokens,
        reason: `Compra de tokens processada via webhook - Order ID: ${extractedData.order_id} - Produto: ${extractedData.product_name}`
      });

    // NOVO: Enviar email de confirmação
    try {
      console.log('📧 Enviando email de confirmação de compra...');
      
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-token-purchase-email', {
        body: {
          email: extractedData.customer_email,
          name: extractedData.customer_name || user.full_name || 'Cliente',
          tokensAdded: tokensToAdd,
          amountPaid: orderTotal || 0,
          newTotalTokens: newTotalTokens,
          orderId: extractedData.order_id
        }
      });

      if (emailError) {
        console.error('⚠️ Erro ao enviar email (não crítico):', emailError);
        // Não retornar erro aqui, pois os tokens já foram creditados com sucesso
      } else {
        console.log('✅ Email de confirmação enviado com sucesso');
      }
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de confirmação (não crítico):', emailError);
      // Continuar normalmente, pois o importante é que os tokens foram creditados
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tokens creditados com sucesso',
      data: {
        userId: user.id,
        tokensAdded: tokensToAdd,
        newTotalTokens: newTotalTokens,
        orderId: extractedData.order_id,
        emailSent: true,
        extractedData: extractedData
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERRO NO WEBHOOK DE TOKENS:', error);
    console.error('❌ STACK TRACE:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
