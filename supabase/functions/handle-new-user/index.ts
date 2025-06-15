
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

    // Para usuários confirmados (após clique no email), criar perfil
    if (webhookData.type === "user" && webhookData.record) {
      const user = webhookData.record;
      const userMetadata = user.user_metadata || user.raw_user_meta_data || {};
      
      // Verificar se o email foi confirmado
      if (user.email_confirmed_at && !user.last_sign_in_at) {
        console.log("Processing confirmed user for:", user.email);

        // Criar perfil do usuário com status pending
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: userMetadata?.full_name,
            avatar_url: userMetadata?.avatar_url,
            subscription_status: "pending",
            checkout_url: "https://pay.kiwify.com.br/nzX4lAh",
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        } else {
          console.log("Profile created successfully for user:", user.email);
        }

        // Não enviar mais email de checkout - usuário será direcionado para /checkout
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

serve(handler);
