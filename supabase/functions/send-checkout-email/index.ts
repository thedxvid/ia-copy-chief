

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

    console.log("Sending checkout email to:", email, "with URL:", checkoutUrl);

    const emailResponse = await resend.emails.send({
      from: "CopyChief <noreply@iacopychief.com>",
      to: [email],
      subject: "🚀 Complete seu acesso ao CopyChief",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; font-size: 32px; margin: 0; font-weight: 700;">CopyChief</h1>
            <p style="color: #6B7280; font-size: 16px; margin: 8px 0 0 0;">Sua plataforma de copywriting com IA</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="color: #1F2937; margin-top: 0; font-size: 24px; font-weight: 600;">Bem-vindo, ${name || 'Usuário'}!</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 16px 0 0 0;">
              Sua conta foi criada com sucesso! Para ter acesso completo à plataforma, 
              você precisa completar o processo de pagamento.
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <table role="presentation" style="margin: 0 auto;">
              <tr>
                <td style="text-align: center;">
                  <a href="${checkoutUrl}" 
                     target="_blank"
                     rel="noopener noreferrer"
                     style="
                       background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                       color: #ffffff;
                       padding: 18px 36px;
                       border-radius: 8px;
                       text-decoration: none;
                       font-weight: 600;
                       font-size: 18px;
                       display: inline-block;
                       text-align: center;
                       line-height: 1.2;
                       min-width: 200px;
                       box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                       transition: all 0.3s ease;
                     ">
                    🚀 Finalizar Pagamento
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #6B7280; font-size: 14px; margin: 16px 0 0 0;">
              Ou copie e cole este link no seu navegador:<br>
              <span style="color: #3B82F6; word-break: break-all; font-size: 12px;">${checkoutUrl}</span>
            </p>
          </div>
          
          <div style="background: #EFF6FF; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3B82F6;">
            <h3 style="color: #1E40AF; margin-top: 0; font-size: 18px; font-weight: 600;">O que você vai ter acesso:</h3>
            <ul style="color: #1F2937; line-height: 1.8; margin: 16px 0 0 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">✨ Geração ilimitada de copies com IA</li>
              <li style="margin-bottom: 8px;">🎯 Agentes especializados por nicho</li>
              <li style="margin-bottom: 8px;">📊 Análise de performance em tempo real</li>
              <li style="margin-bottom: 8px;">🚀 Templates profissionais</li>
              <li style="margin-bottom: 8px;">💎 Suporte prioritário</li>
            </ul>
          </div>
          
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; font-weight: 600; margin: 0; font-size: 16px;">
              ⚡ Oferta por tempo limitado! Complete seu pagamento agora.
            </p>
          </div>
          
          <div style="text-align: center; padding: 24px 0; border-top: 1px solid #E5E7EB; margin-top: 30px;">
            <p style="color: #6B7280; font-size: 14px; margin: 0; line-height: 1.6;">
              Precisa de ajuda? Responda este email ou acesse nosso suporte.<br>
              © 2025 CopyChief. Todos os direitos reservados.
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

