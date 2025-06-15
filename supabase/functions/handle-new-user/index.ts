
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookData = await req.json();
    console.log("Webhook received:", webhookData);

    // Para signup confirmations, enviar email personalizado
    if (webhookData.event === "user.confirmation" || webhookData.record?.event_type === "signup") {
      const user = webhookData.record || webhookData;
      const userMetadata = user.user_metadata || user.raw_user_meta_data || {};
      
      console.log("Processing signup confirmation for:", user.email);

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: userMetadata?.full_name,
          avatar_url: userMetadata?.avatar_url,
          subscription_status: "pending",
          checkout_url: userMetadata?.checkout_url || "https://pay.kiwify.com.br/nzX4lAh",
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      // Enviar email de confirmação personalizado
      if (user.email && userMetadata?.confirmation_url) {
        await sendCustomConfirmationEmail(
          user.email, 
          userMetadata?.full_name || "Usuário", 
          userMetadata.confirmation_url
        );
      }
    }

    // Para novos usuários confirmados, processar checkout
    if (webhookData.event === "user.created" || webhookData.record?.event_type === "user.created") {
      const { user_metadata, id, email } = webhookData.record || webhookData;
      
      const checkoutUrl = user_metadata?.checkout_url || "https://pay.kiwify.com.br/nzX4lAh";

      // Criar perfil se não existir
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: id,
          full_name: user_metadata?.full_name,
          avatar_url: user_metadata?.avatar_url,
          subscription_status: "pending",
          checkout_url: checkoutUrl,
        });

      if (error) {
        console.error("Error creating/updating profile:", error);
      }

      // Enviar email com link de checkout
      await sendCheckoutEmail(email, user_metadata?.full_name, checkoutUrl);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in handle-new-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendCustomConfirmationEmail(email: string, name: string, confirmationUrl: string) {
  try {
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-confirmation-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ 
        email, 
        name, 
        confirmationUrl 
      }),
    });

    if (!response.ok) {
      console.error("Failed to send custom confirmation email");
    } else {
      console.log("Custom confirmation email sent successfully");
    }
  } catch (error) {
    console.error("Error sending custom confirmation email:", error);
  }
}

async function sendCheckoutEmail(email: string, name: string, checkoutUrl: string) {
  try {
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-checkout-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ email, name, checkoutUrl }),
    });

    if (!response.ok) {
      console.error("Failed to send checkout email");
    }
  } catch (error) {
    console.error("Error sending checkout email:", error);
  }
}

serve(handler);
