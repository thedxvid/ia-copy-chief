
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

    // VERIFICAÇÃO DE ADMINISTRADOR - ADICIONADA PARA SEGURANÇA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar se o usuário é administrador
    const { data: isAdmin, error: isAdminError } = await supabase
      .rpc('is_admin', { p_user_id: user.id });

    if (isAdminError || !isAdmin) {
      console.log('Acesso negado para usuário:', user.email, 'Admin status:', isAdmin);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Recurso restrito a administradores.' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Admin verificado:', user.email, 'procedendo com auto-ativação');

    // Email do admin para ativar automaticamente
    const adminEmail = "davicastrowp@gmail.com";

    console.log("Auto-activating admin user:", adminEmail);

    // Buscar o usuário pelo email
    const { data: users, error: userError2 } = await supabase.auth.admin.listUsers();
    
    if (userError2) {
      console.error("Error listing users:", userError2);
      return new Response(
        JSON.stringify({ error: userError2.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const targetUser = users.users.find(u => u.email === adminEmail);
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "Admin user not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Ativar subscription do usuário por 30 dias
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 30);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        payment_approved_at: new Date().toISOString(),
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        checkout_url: "https://pay.kiwify.com.br/nzX4lAh",
      })
      .eq("id", targetUser.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Admin user activated successfully:", adminEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user activated for 30 days",
        email: adminEmail,
        subscription_expires_at: subscriptionExpiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in activate-admin:", error);
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
