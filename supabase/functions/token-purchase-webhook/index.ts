
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para os dados do Digital Guru Manager
interface DigitalGuruWebhookData {
  id: string;
  status: string;
  type: string;
  webhook_type: string;
  contact: {
    id: string;
    name: string;
    email: string;
    doc?: string;
    phone_number?: string;
    phone_local_code?: string;
    company_name?: string;
  };
  product: {
    id: string;
    name: string;
    total_value: number;
    unit_value: number;
    qty: number;
    marketplace_name: string;
    producer: {
      name: string;
      marketplace_id: string;
      contact_email?: string;
    };
  };
  items: Array<{
    id: string;
    name: string;
    total_value: number;
    unit_value: number;
    qty: number;
    type: string;
    marketplace_name: string;
    producer: {
      name: string;
      marketplace_id: string;
      contact_email?: string;
    };
  }>;
  payment: {
    total: number;
    gross: number;
    net: number;
    method?: string;
    currency: string;
    installments?: {
      qty: number;
      value: number;
      interest: number;
    };
    credit_card?: {
      brand: string;
      first_digits: string;
      last_digits: string;
    };
  };
  dates: {
    created_at: string;
    confirmed_at?: string;
    ordered_at?: string;
    canceled_at?: string;
    updated_at: string;
  };
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
    const rawData: DigitalGuruWebhookData = await req.json();
    
    console.log('🎯 TOKEN PURCHASE WEBHOOK - DADOS BRUTOS RECEBIDOS:', JSON.stringify(rawData, null, 2));

    // Extrair dados do webhook do Digital Guru Manager
    const extractedData = {
      event: rawData.webhook_type || 'transaction',
      order_id: rawData.id,
      order_status: rawData.status,
      customer_email: rawData.contact?.email,
      customer_name: rawData.contact?.name,
      product_name: rawData.product?.name || (rawData.items?.[0]?.name),
      order_total: rawData.payment?.total || rawData.product?.total_value || (rawData.items?.[0]?.total_value) || 0,
      payment_method: rawData.payment?.method || 'credit_card',
      created_at: rawData.dates?.confirmed_at || rawData.dates?.created_at
    };

    console.log('🔍 DADOS EXTRAÍDOS E PROCESSADOS:', {
      event: extractedData.event,
      orderId: extractedData.order_id,
      status: extractedData.order_status,
      email: extractedData.customer_email,
      product: extractedData.product_name,
      total: extractedData.order_total
    });

    // Validar se é um evento de pagamento aprovado
    const approvedEvents = ['approved', 'paid', 'completed', 'success', 'confirmed'];
    const isApprovedEvent = approvedEvents.includes(extractedData.order_status?.toLowerCase());

    if (!isApprovedEvent) {
      console.log('⚠️ Evento ignorado - Status:', extractedData.order_status);
      return new Response('Event ignored - not approved', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Validar dados obrigatórios
    if (!extractedData.customer_email || !extractedData.order_id) {
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

    // Determinar quantidade de tokens baseado no valor
    let tokensToAdd = 0;
    const productLower = (extractedData.product_name || '').toLowerCase();
    const orderTotal = extractedData.order_total;
    
    console.log('🔍 DETERMINANDO TOKENS:', {
      productName: extractedData.product_name,
      productLower: productLower,
      orderTotal: orderTotal
    });

    // Mapear valores para tokens
    if (orderTotal >= 8 && orderTotal <= 12) {
      tokensToAdd = 10000;        // R$ 10 = 10k tokens
    } else if (orderTotal >= 90 && orderTotal <= 110) {
      tokensToAdd = 100000;       // R$ 100 = 100k tokens
    } else if (orderTotal >= 190 && orderTotal <= 210) {
      tokensToAdd = 250000;       // R$ 200 = 250k tokens
    } else if (orderTotal >= 290 && orderTotal <= 310) {
      tokensToAdd = 500000;       // R$ 300 = 500k tokens
    } else if (orderTotal >= 390 && orderTotal <= 410) {
      tokensToAdd = 1000000;      // R$ 400 = 1M tokens
    } else if (productLower.includes('10k') || productLower.includes('10.000') || productLower.includes('10 mil')) {
      tokensToAdd = 10000;
    } else if (productLower.includes('100k') || productLower.includes('100.000') || productLower.includes('100 mil')) {
      tokensToAdd = 100000;
    } else if (productLower.includes('250k') || productLower.includes('250.000') || productLower.includes('250 mil')) {
      tokensToAdd = 250000;
    } else if (productLower.includes('500k') || productLower.includes('500.000') || productLower.includes('500 mil')) {
      tokensToAdd = 500000;
    } else if (productLower.includes('1m') || productLower.includes('1.000.000') || productLower.includes('1 milhão')) {
      tokensToAdd = 1000000;
    }

    console.log('💰 TOKENS DETERMINADOS:', {
      tokensToAdd: tokensToAdd,
      baseadoEm: tokensToAdd > 0 ? 'valor_ou_nome' : 'nenhum'
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
          package_id: '00000000-0000-0000-0000-000000000000'
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
        admin_user_id: user.id,
        action_type: 'add_extra',
        old_value: user.extra_tokens || 0,
        new_value: newTotalTokens,
        reason: `Compra de tokens processada via webhook - Order ID: ${extractedData.order_id} - Produto: ${extractedData.product_name}`
      });

    // Enviar email de confirmação
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
      } else {
        console.log('✅ Email de confirmação enviado com sucesso');
      }
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de confirmação (não crítico):', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tokens creditados com sucesso',
      data: {
        userId: user.id,
        tokensAdded: tokensToAdd,
        newTotalTokens: newTotalTokens,
        orderId: extractedData.order_id,
        emailSent: true
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
