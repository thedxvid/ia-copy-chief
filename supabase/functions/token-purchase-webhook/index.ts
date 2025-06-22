
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
    
    console.log('[Webhook Tokens] DADOS BRUTOS RECEBIDOS:', JSON.stringify(rawData, null, 2));

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

    console.log('[Webhook Tokens] DADOS EXTRAÍDOS E PROCESSADOS:', {
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
      console.log('[Webhook Tokens] Evento ignorado - Status:', extractedData.order_status);
      return new Response(JSON.stringify({ 
        status: 'ignored', 
        reason: 'Status não aprovado',
        order_status: extractedData.order_status 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar dados obrigatórios
    if (!extractedData.customer_email || !extractedData.order_id) {
      console.error('[Webhook Tokens] Dados obrigatórios ausentes:', {
        email: extractedData.customer_email,
        orderId: extractedData.order_id,
        product: extractedData.product_name
      });
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'Dados obrigatórios ausentes',
        missing: {
          email: !extractedData.customer_email,
          orderId: !extractedData.order_id
        }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar usuário por email usando query direta
    console.log('[Webhook Tokens] Buscando usuário por email:', extractedData.customer_email);
    
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('[Webhook Tokens] Erro ao buscar usuários:', usersError);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'Erro ao buscar usuários' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authUser = allUsers.users.find(user => user.email === extractedData.customer_email);
    
    if (!authUser) {
      console.error('[Webhook Tokens] Usuário não encontrado por email:', extractedData.customer_email);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'Usuário não encontrado',
        email: extractedData.customer_email 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar profile do usuário
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, extra_tokens')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      console.error('[Webhook Tokens] Profile do usuário não encontrado:', authUser.id, userError);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'Profile do usuário não encontrado',
        user_id: authUser.id 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Webhook Tokens] Usuário encontrado:', {
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
      console.log('[Webhook Tokens] Compra já processada:', extractedData.order_id);
      return new Response(JSON.stringify({ 
        status: 'ignored', 
        reason: 'Compra já processada',
        order_id: extractedData.order_id 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determinar quantidade de tokens baseado no valor
    let tokensToAdd = 0;
    const productLower = (extractedData.product_name || '').toLowerCase();
    const orderTotal = extractedData.order_total;
    
    console.log('[Webhook Tokens] DETERMINANDO TOKENS:', {
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

    console.log('[Webhook Tokens] TOKENS DETERMINADOS:', {
      tokensToAdd: tokensToAdd,
      baseadoEm: tokensToAdd > 0 ? 'valor_ou_nome' : 'nenhum'
    });

    if (tokensToAdd === 0) {
      console.error('[Webhook Tokens] Não foi possível determinar quantidade de tokens:', {
        product: extractedData.product_name,
        total: extractedData.order_total
      });
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'Não foi possível determinar quantidade de tokens',
        product: extractedData.product_name,
        total: extractedData.order_total 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CORREÇÃO: Buscar o package_id correto baseado na quantidade de tokens
    console.log('[Webhook Tokens] Buscando pacote para', tokensToAdd, 'tokens');
    
    const { data: tokenPackage, error: packageError } = await supabase
      .from('token_packages')
      .select('id, name')
      .eq('tokens_amount', tokensToAdd)
      .eq('is_active', true)
      .single();

    let packageId = null;
    
    if (packageError || !tokenPackage) {
      console.warn('[Webhook Tokens] Pacote não encontrado para', tokensToAdd, 'tokens:', packageError);
      
      // Fallback: buscar qualquer pacote ativo (para não falhar a compra)
      const { data: fallbackPackage } = await supabase
        .from('token_packages')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (fallbackPackage) {
        packageId = fallbackPackage.id;
        console.log('[Webhook Tokens] USANDO PACOTE FALLBACK:', fallbackPackage.name);
      } else {
        console.error('[Webhook Tokens] Nenhum pacote ativo encontrado');
        return new Response(JSON.stringify({ 
          status: 'error', 
          reason: 'Nenhum pacote de tokens encontrado' 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      packageId = tokenPackage.id;
      console.log('[Webhook Tokens] PACOTE ENCONTRADO:', tokenPackage.name, 'ID:', packageId);
    }

    // Buscar ou criar registro de compra
    let purchaseId = existingPurchase?.id;
    
    if (!existingPurchase) {
      // Criar novo registro de compra com o package_id correto
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('token_package_purchases')
        .insert({
          user_id: user.id,
          digital_guru_order_id: extractedData.order_id,
          tokens_purchased: tokensToAdd,
          amount_paid: orderTotal || 0,
          payment_status: 'completed',
          processed_at: new Date().toISOString(),
          package_id: packageId
        })
        .select('id')
        .single();

      if (purchaseError) {
        console.error('[Webhook Tokens] Erro ao criar registro de compra:', purchaseError);
        return new Response(JSON.stringify({ 
          status: 'error', 
          reason: 'Erro ao criar registro de compra',
          error: purchaseError.message 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      purchaseId = newPurchase.id;
      console.log('[Webhook Tokens] Registro de compra criado:', purchaseId);
    } else {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('token_package_purchases')
        .update({
          payment_status: 'completed',
          processed_at: new Date().toISOString(),
          tokens_purchased: tokensToAdd,
          amount_paid: orderTotal || 0,
          package_id: packageId
        })
        .eq('id', existingPurchase.id);

      if (updateError) {
        console.error('[Webhook Tokens] Erro ao atualizar registro de compra:', updateError);
        return new Response(JSON.stringify({ 
          status: 'error', 
          reason: 'Erro ao atualizar registro de compra',
          error: updateError.message 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('[Webhook Tokens] Registro de compra atualizado:', existingPurchase.id);
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
      console.error('[Webhook Tokens] Erro ao creditar tokens:', creditError);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'Erro ao creditar tokens',
        error: creditError.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Webhook Tokens] TOKENS CREDITADOS COM SUCESSO:', {
      userId: user.id,
      tokensAdded: tokensToAdd,
      newExtraTokens: newTotalTokens,
      orderId: extractedData.order_id,
      packageId: packageId
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
        reason: `Compra de tokens processada via webhook - Order ID: ${extractedData.order_id} - Produto: ${extractedData.product_name} - Package ID: ${packageId}`
      });

    // Enviar email de confirmação
    try {
      console.log('[Webhook Tokens] Enviando email de confirmação de compra...');
      
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
        console.error('[Webhook Tokens] Erro ao enviar email (não crítico):', emailError);
      } else {
        console.log('[Webhook Tokens] Email de confirmação enviado com sucesso');
      }
    } catch (emailError) {
      console.error('[Webhook Tokens] Erro ao enviar email de confirmação (não crítico):', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tokens creditados com sucesso',
      data: {
        userId: user.id,
        tokensAdded: tokensToAdd,
        newTotalTokens: newTotalTokens,
        orderId: extractedData.order_id,
        packageId: packageId,
        emailSent: true
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook Tokens] ERRO NO WEBHOOK DE TOKENS:', error);
    console.error('[Webhook Tokens] STACK TRACE:', error.stack);
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
