
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KiwifyWebhookData {
  event: string;
  order_id: string;
  customer: {
    email: string;
    id?: string;
  };
  status: string;
  product?: {
    id: string;
    name: string;
  };
  payment?: {
    amount: number;
    currency: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookData: KiwifyWebhookData = await req.json();
    console.log("Kiwify webhook received:", webhookData);

    // Salvar webhook para auditoria
    const { error: webhookError } = await supabase
      .from("kiwify_webhooks")
      .insert({
        event_type: webhookData.event,
        kiwify_order_id: webhookData.order_id,
        customer_email: webhookData.customer.email,
        customer_id: webhookData.customer.id,
        status: webhookData.status,
        raw_data: webhookData,
        processed: false,
      });

    if (webhookError) {
      console.error("Error saving webhook:", webhookError);
    }

    // Processar eventos de pagamento
    if (webhookData.event === "order_paid" || webhookData.event === "payment_approved") {
      await processPaymentApproved(supabase, webhookData);
    } else if (webhookData.event === "order_cancelled" || webhookData.event === "payment_cancelled") {
      await processPaymentCancelled(supabase, webhookData);
    }

    // Marcar webhook como processado
    await supabase
      .from("kiwify_webhooks")
      .update({ processed: true })
      .eq("kiwify_order_id", webhookData.order_id);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function processPaymentApproved(supabase: any, webhookData: KiwifyWebhookData) {
  console.log("Processing payment approved for:", webhookData.customer.email);

  // Encontrar usuário pelo email
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", (await supabase.auth.admin.getUserByEmail(webhookData.customer.email)).data.user?.id);

  if (profileError || !profiles?.length) {
    console.error("User not found for email:", webhookData.customer.email);
    return;
  }

  const profile = profiles[0];

  // Atualizar subscription do usuário
  const subscriptionExpiresAt = new Date();
  subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 1); // 1 mês de acesso

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      kiwify_customer_id: webhookData.customer.id,
      payment_approved_at: new Date().toISOString(),
      subscription_expires_at: subscriptionExpiresAt.toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error updating profile:", updateError);
    return;
  }

  // Enviar email de confirmação
  await sendWelcomeEmail(webhookData.customer.email, profile.full_name);
}

async function processPaymentCancelled(supabase: any, webhookData: KiwifyWebhookData) {
  console.log("Processing payment cancelled for:", webhookData.customer.email);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", (await supabase.auth.admin.getUserByEmail(webhookData.customer.email)).data.user?.id);

  if (profiles?.length) {
    await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
      })
      .eq("id", profiles[0].id);
  }
}

async function sendWelcomeEmail(email: string, name: string) {
  try {
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      console.error("Failed to send welcome email");
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

serve(handler);
