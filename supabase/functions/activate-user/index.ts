
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivateUserRequest {
  email: string;
}

// Função para gerar senha temporária segura
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Maiúscula
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]; // Símbolo
  
  // Completar com caracteres aleatórios até 8 caracteres
  for (let i = 4; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => 0.5 - Math.random()).join('');
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

    const { email }: ActivateUserRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("=== ACTIVATE USER START ===");
    console.log("Email to activate:", email.toLowerCase());

    // Gerar senha temporária
    const temporaryPassword = generateTemporaryPassword();
    console.log("Generated temporary password:", temporaryPassword);

    // Verificar se usuário já existe
    console.log("Checking if user exists...");
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error(`Erro ao verificar usuários: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log("User found, updating existing user:", email);
      userId = existingUser.id;
      
      // Atualizar senha do usuário existente
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        email_confirm: true
      });

      if (updateError) {
        console.error("Error updating user password:", updateError);
        throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
      }
    } else {
      console.log("User not found, creating new user:", email);
      isNewUser = true;
      
      // Criar novo usuário com senha temporária
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0], // Nome baseado no email
          first_login: true // Marcar como primeiro login
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      if (!newUser.user) {
        throw new Error("Falha ao criar usuário - dados não retornados");
      }

      userId = newUser.user.id;
      console.log("User created successfully:", email);
    }

    console.log("=== ACTIVATING SUBSCRIPTION ===");
    console.log("User ID:", userId);
    console.log("Email:", email);

    // Ativar subscription do usuário por 30 dias
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 30);

    console.log("Updating existing profile for user:", email);
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        subscription_status: "active",
        payment_approved_at: new Date().toISOString(),
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        checkout_url: "https://pay.kiwify.com.br/nzX4lAh",
        monthly_tokens: 25000, // Resetar tokens
        extra_tokens: 0,
        full_name: email.split('@')[0],
        first_login: true // Marcar como primeiro login
      }, {
        onConflict: 'id'
      });

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
    }

    console.log("Profile updated successfully");
    console.log("=== SUBSCRIPTION ACTIVATED ===");

    // Enviar email com credenciais temporárias
    console.log("=== SENDING CREDENTIALS EMAIL ===");
    console.log("Sending credentials email to:", email);

    const emailResponse = await supabase.functions.invoke('send-credentials-email', {
      body: { 
        email: email.toLowerCase(), 
        name: email.split('@')[0],
        temporaryPassword: temporaryPassword,
        isNewUser: isNewUser
      },
    });

    console.log("Email function response data:", emailResponse.data);
    console.log("Email function response error:", emailResponse.error);

    let emailSent = false;
    if (emailResponse.error) {
      console.error("Error sending credentials email:", emailResponse.error);
    } else {
      console.log("Credentials email sent successfully to:", email);
      emailSent = true;
    }

    console.log("=== ACTIVATION COMPLETED ===");
    console.log("User activation completed successfully:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser ? "Usuário criado e ativado com sucesso" : "Usuário ativado com sucesso",
        email: email.toLowerCase(),
        isNewUser,
        emailSent,
        temporaryPassword: temporaryPassword, // Para debug do admin
        subscription_expires_at: subscriptionExpiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in activate-user:", error);
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
