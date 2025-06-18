
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

    console.log("=== ACTIVATE USER START ===");
    console.log("Email to activate:", email);

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

    // Verificar se o usuário já existe
    console.log("Checking if user exists...");
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
    let userId = "";
    
    if (!user) {
      console.log("User not found, creating new user:", email);
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
      userId = newUser.user?.id || "";
    } else {
      console.log("User found, activating existing user:", email);
      userId = user.id;
    }

    if (!userId) {
      console.error("No user ID available");
      return new Response(
        JSON.stringify({ error: "Erro ao obter ID do usuário" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Ativar subscription
    console.log("Activating user subscription for user ID:", userId);
    await activateUserSubscription(supabase, userId, email);
    
    // Enviar email de boas-vindas para novo usuário
    if (isNewUser) {
      console.log("=== SENDING WELCOME EMAIL ===");
      console.log("Sending welcome email to new user:", email);
      
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: { 
            email: email,
            name: email.split('@')[0],
            isActivatedUser: true
          },
        });

        console.log("Email function response data:", emailData);
        console.log("Email function response error:", emailError);

        if (emailError) {
          console.error("Error from email function:", emailError);
          // Não falhar a ativação, mas logar o erro
          console.error("Warning: Welcome email failed to send, but user activation was successful");
        } else {
          console.log("Welcome email sent successfully to:", email);
        }
      } catch (emailException) {
        console.error("Exception while sending welcome email:", emailException);
        // Não falhar a ativação, mas logar o erro
        console.error("Warning: Welcome email failed with exception, but user activation was successful");
      }
    }

    console.log("=== ACTIVATION COMPLETED ===");
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
    console.error("=== ACTIVATION ERROR ===");
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
  console.log("=== ACTIVATING SUBSCRIPTION ===");
  console.log("User ID:", userId);
  console.log("Email:", email);
  
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
    console.log("Updating existing profile for user:", email);
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
    console.log("Profile updated successfully");
  } else {
    console.log("Creating new profile for user:", email);
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
    console.log("Profile created successfully");
  }

  console.log("=== SUBSCRIPTION ACTIVATED ===");
}

serve(handler);
