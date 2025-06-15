
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

    const { user_metadata, id, email } = await req.json();

    // URL de checkout da Kiwify (substitua pela sua URL real)
    const checkoutUrl = user_metadata?.checkout_url || "https://kiwify.app/checkout/sua-oferta";

    // Criar perfil do usuário
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: id,
        full_name: user_metadata?.full_name,
        avatar_url: user_metadata?.avatar_url,
        subscription_status: "pending",
        checkout_url: checkoutUrl,
      });

    if (error) {
      console.error("Error creating profile:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Enviar email com link de checkout
    await sendCheckoutEmail(email, user_metadata?.full_name, checkoutUrl);

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
