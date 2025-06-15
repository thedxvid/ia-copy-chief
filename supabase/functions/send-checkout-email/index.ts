
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutEmailRequest {
  email: string;
  name: string;
  checkoutUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, checkoutUrl }: CheckoutEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "CopyMaster <noreply@copymaster.app>",
      to: [email],
      subject: "🚀 Complete seu acesso ao CopyMaster",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0;">CopyMaster</h1>
            <p style="color: #6B7280; font-size: 16px;">Sua plataforma de copywriting com IA</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1F2937; margin-top: 0;">Bem-vindo, ${name || 'Usuário'}!</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
              Sua conta foi criada com sucesso! Para ter acesso completo à plataforma, 
              você precisa completar o processo de pagamento.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${checkoutUrl}" 
               style="background: #10B981; color: white; padding: 20px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 18px;">
              🚀 Finalizar Pagamento
            </a>
          </div>
          
          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin-top: 0;">O que você vai ter acesso:</h3>
            <ul style="color: #1F2937; line-height: 1.8;">
              <li>✨ Geração ilimitada de copies com IA</li>
              <li>🎯 Agentes especializados por nicho</li>
              <li>📊 Análise de performance em tempo real</li>
              <li>🚀 Templates profissionais</li>
              <li>💎 Suporte prioritário</li>
            </ul>
          </div>
          
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; font-weight: bold; margin: 0;">
              ⚡ Oferta por tempo limitado! Complete seu pagamento agora.
            </p>
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

    console.log("Checkout email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending checkout email:", error);
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
