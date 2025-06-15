
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

    // Para usuários confirmados (após clique no email), enviar welcome email e processar checkout
    if (webhookData.type === "user" && webhookData.record) {
      const user = webhookData.record;
      const userMetadata = user.user_metadata || user.raw_user_meta_data || {};
      
      // Verificar se o email foi confirmado
      if (user.email_confirmed_at && !user.last_sign_in_at) {
        console.log("Processing confirmed user for:", user.email);

        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: userMetadata?.full_name,
            avatar_url: userMetadata?.avatar_url,
            subscription_status: "pending",
            checkout_url: userMetadata?.checkout_url || "https://pay.kiwify.com.br/nzX4lAh",
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // Enviar email de boas-vindas com link para checkout
        const checkoutUrl = userMetadata?.checkout_url || "https://pay.kiwify.com.br/nzX4lAh";
        await sendWelcomeEmail(user.email, userMetadata?.full_name, checkoutUrl);
      }
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

async function sendWelcomeEmail(email: string, name: string, checkoutUrl: string) {
  try {
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ email, name, checkoutUrl }),
    });

    if (!response.ok) {
      console.error("Failed to send welcome email");
    } else {
      console.log("Welcome email sent successfully");
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

serve(handler);
