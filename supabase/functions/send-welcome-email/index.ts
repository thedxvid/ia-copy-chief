
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    const dashboardUrl = `${new URL(req.url).origin}/dashboard`;

    const emailResponse = await resend.emails.send({
      from: "CopyMaster <noreply@copymaster.app>",
      to: [email],
      subject: "🎉 Pagamento Aprovado - Bem-vindo ao CopyMaster!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0;">CopyMaster</h1>
            <p style="color: #6B7280; font-size: 16px;">Sua plataforma de copywriting com IA</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1F2937; margin-top: 0;">🎉 Pagamento Aprovado!</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
              Olá ${name || 'Usuário'},<br><br>
              Seu pagamento foi processado com sucesso! Agora você tem acesso completo ao CopyMaster.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background: #3B82F6; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Acessar Dashboard
            </a>
          </div>
          
          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin-top: 0;">O que você pode fazer agora:</h3>
            <ul style="color: #1F2937; line-height: 1.8;">
              <li>✨ Gerar copies para qualquer nicho</li>
              <li>🎯 Usar nossos agentes especializados</li>
              <li>📊 Analisar performance de campanhas</li>
              <li>🚀 Criar campanhas completas</li>
              <li>💡 Acessar templates premium</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #E5E7EB; margin-top: 30px;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              Precisa de ajuda? Responda este email.<br>
              © 2025 CopyMaster. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
