
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

    const { email } = await req.json();

    console.log("Attempting to activate user:", email);

    if (!email || !email.includes('@')) {
      console.error("Invalid email provided:", email);
      return new Response(
        JSON.stringify({ error: "Email inválido fornecido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Primeiro, verificar se o usuário já existe
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar usuários: " + userError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const user = users.users.find(u => u.email === email);
    let isNewUser = false;
    
    if (!user) {
      console.log("User not found, attempting to create:", email);
      isNewUser = true;
      
      // Criar usuário se não existir
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: Math.random().toString(36).slice(-8) + "Aa1!", // Senha temporária
        email_confirm: true // Confirmar email automaticamente
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar usuário: " + createError.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log("User created successfully:", newUser.user?.email);
      
      // Usar o usuário recém-criado
      const userId = newUser.user?.id;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Erro ao obter ID do usuário criado" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Criar perfil e ativar subscription
      await activateUserSubscription(supabase, userId, email);
      
      // Enviar email de boas-vindas para novo usuário
      try {
        console.log("Sending welcome email to new user:", email);
        const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: { 
            email: email,
            name: email.split('@')[0],
            isActivatedUser: true
          },
        });

        if (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Não falhar a ativação por causa do email
        } else {
          console.log("Welcome email sent successfully to:", email);
        }
      } catch (emailErr) {
        console.error("Exception sending welcome email:", emailErr);
        // Não falhar a ativação por causa do email
      }
      
    } else {
      console.log("User found, activating subscription:", email);
      await activateUserSubscription(supabase, user.id, email);
    }

    console.log("User activation completed successfully:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Usuário ${email} foi ativado com sucesso por 30 dias`,
        email: email,
        isNewUser: isNewUser
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in activate-user function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno: " + error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function activateUserSubscription(supabase: any, userId: string, email: string) {
  // Data de expiração: 30 dias a partir de agora
  const subscriptionExpiresAt = new Date();
  subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 30);

  // Verificar se já existe um perfil
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (existingProfile) {
    // Atualizar perfil existente
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        payment_approved_at: new Date().toISOString(),
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        checkout_url: "https://pay.kiwify.com.br/nzX4lAh",
        monthly_tokens: 25000, // Tokens mensais
        extra_tokens: 0,
        total_tokens_used: 0
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating existing profile:", updateError);
      throw new Error("Erro ao atualizar perfil existente: " + updateError.message);
    }
  } else {
    // Criar novo perfil
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: email.split('@')[0], // Usar parte do email como nome
        subscription_status: "active",
        payment_approved_at: new Date().toISOString(),
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        checkout_url: "https://pay.kiwify.com.br/nzX4lAh",
        monthly_tokens: 25000, // Tokens mensais
        extra_tokens: 0,
        total_tokens_used: 0
      });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      throw new Error("Erro ao criar perfil: " + insertError.message);
    }
  }

  console.log("Profile updated/created successfully for user:", email);
}

serve(handler);
