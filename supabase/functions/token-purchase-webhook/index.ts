
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenPurchaseWebhookData {
  event: string;
  data: {
    order_id: string;
    order_status: string;
    customer_email: string;
    customer_name?: string;
    product_name: string;
    order_total: number;
    payment_method?: string;
    created_at?: string;
  };
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
    const webhookData: TokenPurchaseWebhookData = await req.json();
    
    console.log('🎯 TOKEN PURCHASE WEBHOOK RECEBIDO:', {
      event: webhookData.event,
      orderId: webhookData.data?.order_id,
      status: webhookData.data?.order_status,
      email: webhookData.data?.customer_email,
      product: webhookData.data?.product_name,
      total: webhookData.data?.order_total
    });

    // Validar se é um evento de pagamento aprovado
    if (webhookData.event !== 'order.approved' && 
        webhookData.event !== 'order.paid' && 
        webhookData.event !== 'payment.approved') {
      console.log('⚠️ Evento ignorado:', webhookData.event);
      return new Response('Event ignored', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const { data, order_id, order_status, customer_email, product_name, order_total } = webhookData.data;

    // Validar dados obrigatórios
    if (!customer_email || !order_id || !product_name) {
      console.error('❌ Dados obrigatórios ausentes:', {
        email: customer_email,
        orderId: order_id,
        product: product_name
      });
      return new Response('Missing required data', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, extra_tokens')
      .eq('id', (await supabase.auth.admin.getUserByEmail(customer_email)).data.user?.id)
      .single();

    if (userError || !user) {
      console.error('❌ Usuário não encontrado:', customer_email, userError);
      return new Response('User not found', { 
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
      .or(`digital_guru_order_id.eq.${order_id}`)
      .eq('user_id', user.id)
      .single();

    if (existingPurchase && existingPurchase.payment_status === 'completed') {
      console.log('⚠️ Compra já processada:', order_id);
      return new Response('Purchase already processed', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Determinar quantidade de tokens baseado no produto/valor
    let tokensToAdd = 0;
    const productLower = product_name.toLowerCase();
    
    // Mapear produtos para tokens
    if (productLower.includes('100k') || productLower.includes('100.000')) {
      tokensToAdd = 100000;
    } else if (productLower.includes('500k') || productLower.includes('500.000')) {
      tokensToAdd = 500000;
    } else if (productLower.includes('1m') || productLower.includes('1.000.000')) {
      tokensToAdd = 1000000;
    } else if (order_total) {
      // Fallback: calcular baseado no valor (ex: R$ 50 = 100k tokens)
      if (order_total >= 45 && order_total <= 55) tokensToAdd = 100000;
      else if (order_total >= 95 && order_total <= 105) tokensToAdd = 500000;
      else if (order_total >= 145 && order_total <= 155) tokensToAdd = 1000000;
    }

    if (tokensToAdd === 0) {
      console.error('❌ Não foi possível determinar quantidade de tokens:', {
        product: product_name,
        total: order_total
      });
      return new Response('Could not determine token amount', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('💰 Tokens a serem adicionados:', tokensToAdd);

    // Buscar ou criar registro de compra
    let purchaseId = existingPurchase?.id;
    
    if (!existingPurchase) {
      // Criar novo registro de compra
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('token_package_purchases')
        .insert({
          user_id: user.id,
          digital_guru_order_id: order_id,
          tokens_purchased: tokensToAdd,
          amount_paid: order_total || 0,
          payment_status: 'completed',
          processed_at: new Date().toISOString()
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
          amount_paid: order_total || 0
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
    const { error: creditError } = await supabase
      .from('profiles')
      .update({
        extra_tokens: (user.extra_tokens || 0) + tokensToAdd,
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
      newExtraTokens: (user.extra_tokens || 0) + tokensToAdd,
      orderId: order_id
    });

    // Registrar log de auditoria
    await supabase
      .from('token_audit_logs')
      .insert({
        user_id: user.id,
        admin_user_id: user.id, // Auto-credit via webhook
        action_type: 'add_extra',
        old_value: user.extra_tokens || 0,
        new_value: (user.extra_tokens || 0) + tokensToAdd,
        reason: `Compra de tokens processada via webhook - Order ID: ${order_id}`
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'Tokens creditados com sucesso',
      data: {
        userId: user.id,
        tokensAdded: tokensToAdd,
        orderId: order_id
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERRO NO WEBHOOK DE TOKENS:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
