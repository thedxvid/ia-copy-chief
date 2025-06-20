import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%&amp;*'[Math.floor(Math.random() * 7)];
  for (let i = 4; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Configuração do servidor incompleta" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const temporaryPassword = generateTemporaryPassword();

    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        email_confirm: true
      });
      if (updateError) throw updateError;
    } else {
      isNewUser = true;
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: normalizedEmail.split('@')[0], first_login: true }
      });
      if (createError) throw createError;
      if (!newUser.user) throw new Error("Falha ao criar usuário: dados do usuário não retornados.");
      userId = newUser.user.id;
    }

    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 30);
    const currentDate = new Date().toISOString();
    
    // O gatilho handle_new_user cria um perfil básico. Nós vamos fazer um "upsert" aqui:
    // atualizar o perfil existente ou criar um completo se o gatilho falhar.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
          id: userId,
          full_name: normalizedEmail.split('@')[0],
          subscription_status: "active",
          payment_approved_at: currentDate,
          subscription_expires_at: subscriptionExpiresAt.toISOString(),
          monthly_tokens: 25000,
          extra_tokens: 0,
          updated_at: currentDate,
          tokens_reset_date: currentDate.split('T')[0],
      });

    if (profileError) {
        console.error("Erro no upsert do perfil:", profileError);
        throw profileError;
    }

    let emailSent = false;
    try {
      await supabase.functions.invoke('send-credentials-email', {
        body: { email: normalizedEmail, name: normalizedEmail.split('@')[0], temporaryPassword, isNewUser },
      });
      emailSent = true;
    } catch (e) {
      console.error("Falha ao enviar email (não-crítico):", e);
    }

    return new Response(JSON.stringify({
      success: true,
      message: isNewUser ? "Usuário criado e ativado com sucesso" : "Usuário ativado com sucesso",
      user_id: userId
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    console.error("Erro crítico na função activate-user:", error);
    return new Response(JSON.stringify({ error: "Erro crítico no servidor", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);