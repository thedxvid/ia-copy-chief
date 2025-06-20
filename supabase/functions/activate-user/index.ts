
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
    console.log("=== ACTIVATE USER START ===");
    
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:");
    console.log("- SUPABASE_URL:", !!supabaseUrl);
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      
      return new Response(
        JSON.stringify({ 
          error: "Configuração do servidor incompleta",
          details: "Variáveis de ambiente não configuradas"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: ActivateUserRequest = await req.json();

    console.log("Request validation:");
    console.log("- Email provided:", !!email);
    console.log("- Email value:", email);

    if (!email) {
      console.error("Email não fornecido");
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Processing email:", normalizedEmail);

    // Gerar senha temporária
    const temporaryPassword = generateTemporaryPassword();
    console.log("Generated temporary password");

    // Verificar se usuário já existe
    console.log("=== CHECKING EXISTING USER ===");
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao verificar usuários existentes",
          details: listError.message
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Users list retrieved, count:", existingUsers.users.length);
    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log("=== UPDATING EXISTING USER ===");
      console.log("Existing user ID:", existingUser.id);
      userId = existingUser.id;
      
      // Atualizar senha do usuário existente
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        email_confirm: true
      });

      if (updateError) {
        console.error("Error updating user password:", updateError);
        return new Response(
          JSON.stringify({ 
            error: "Erro ao atualizar senha do usuário",
            details: updateError.message
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      console.log("User password updated successfully");
    } else {
      console.log("=== CREATING NEW USER ===");
      isNewUser = true;
      
      // Criar novo usuário com senha temporária
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: normalizedEmail.split('@')[0],
          first_login: true
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ 
            error: "Erro ao criar usuário",
            details: createError.message
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (!newUser.user) {
        console.error("User creation failed - no user data returned");
        return new Response(
          JSON.stringify({ 
            error: "Falha ao criar usuário",
            details: "Dados do usuário não retornados"
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      userId = newUser.user.id;
      console.log("User created successfully with ID:", userId);
    }

    console.log("=== MANAGING PROFILE ===");
    console.log("User ID:", userId);
    console.log("Email:", normalizedEmail);
    console.log("Is new user:", isNewUser);

    // Calcular data de expiração (30 dias)
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 30);

    // Dados do perfil com valores explícitos para todos os campos obrigatórios
    const profileData = {
      subscription_status: "active",
      payment_approved_at: new Date().toISOString(),
      subscription_expires_at: subscriptionExpiresAt.toISOString(),
      checkout_url: "https://pay.kiwify.com.br/nzX4lAh",
      monthly_tokens: 25000,
      extra_tokens: 0,
      full_name: normalizedEmail.split('@')[0],
      first_login: true,
      is_admin: false,
      tutorial_completed: false,
      tutorial_skipped: false,
      tutorial_step: 0,
      total_tokens_used: 0,
      tokens_reset_date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      notified_10: false,
      notified_50: false,
      notified_90: false,
      updated_at: new Date().toISOString()
    };

    console.log("Profile data prepared:", Object.keys(profileData));

    try {
      // Verificar se o perfil já existe
      console.log("Checking if profile exists...");
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, subscription_status, monthly_tokens")
        .eq("id", userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error("Error checking existing profile:", checkError);
        throw new Error(`Erro ao verificar perfil existente: ${checkError.message}`);
      }

      if (existingProfile) {
        console.log("Profile exists, updating...");
        console.log("Current profile:", existingProfile);
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
        }
        console.log("Profile updated successfully");
      } else {
        console.log("Profile doesn't exist, creating new...");
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            ...profileData,
            created_at: new Date().toISOString() // Adicionar created_at explicitamente
          });

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw new Error(`Erro ao criar perfil: ${insertError.message}`);
        }
        console.log("Profile created successfully");
      }
    } catch (profileError: any) {
      console.error("Profile operation failed:", profileError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao gerenciar perfil do usuário",
          details: profileError.message
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("=== SUBSCRIPTION ACTIVATED SUCCESSFULLY ===");

    // Enviar email com credenciais temporárias (não crítico)
    console.log("=== SENDING CREDENTIALS EMAIL ===");
    let emailSent = false;
    try {
      const emailResponse = await supabase.functions.invoke('send-credentials-email', {
        body: { 
          email: normalizedEmail, 
          name: normalizedEmail.split('@')[0],
          temporaryPassword: temporaryPassword,
          isNewUser: isNewUser
        },
      });

      console.log("Email function response:", emailResponse);

      if (emailResponse.error) {
        console.error("Error sending credentials email:", emailResponse.error);
      } else {
        console.log("Credentials email sent successfully");
        emailSent = true;
      }
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError.message);
      // Não falhar a ativação por causa do email
    }

    console.log("=== ACTIVATION COMPLETED SUCCESSFULLY ===");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser ? "Usuário criado e ativado com sucesso" : "Usuário ativado com sucesso",
        email: normalizedEmail,
        isNewUser,
        emailSent,
        temporaryPassword: temporaryPassword, // Para debug do admin
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        user_id: userId
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("=== CRITICAL ERROR IN ACTIVATE-USER ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error details:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor",
        details: error.message,
        stack: error.stack || "No stack trace available"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
