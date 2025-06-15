
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  name: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, confirmationUrl }: ConfirmationEmailRequest = await req.json();

    console.log(`Sending confirmation email to: ${email}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu Email - CopyMaster</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            padding: 40px 30px;
            text-align: center;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
          }
          
          .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1a1a1a;
          }
          
          .message {
            font-size: 16px;
            color: #666666;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.2s ease;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          
          .features {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin: 30px 0;
          }
          
          .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .feature-item:last-child {
            margin-bottom: 0;
          }
          
          .feature-icon {
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            border-radius: 50%;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .feature-text {
            color: #374151;
            font-size: 14px;
          }
          
          .footer {
            background-color: #1a1a1a;
            padding: 30px;
            text-align: center;
            color: #888888;
          }
          
          .footer p {
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .footer a {
            color: #3B82F6;
            text-decoration: none;
          }
          
          .security-note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          
          .security-note p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            
            .header, .content, .footer {
              padding: 30px 20px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .cta-button {
              display: block;
              text-align: center;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CM</div>
            <h1>CopyMaster</h1>
            <p>Sua plataforma de copywriting com IA</p>
          </div>
          
          <div class="content">
            <div class="greeting">Olá, ${name}! 👋</div>
            
            <div class="message">
              Obrigado por se cadastrar na <strong>CopyMaster</strong>! Estamos muito felizes em tê-lo(a) conosco.
              <br><br>
              Para ativar sua conta e começar a criar copies incríveis com nossa IA, você precisa confirmar seu endereço de email clicando no botão abaixo:
            </div>
            
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="cta-button">
                ✨ Confirmar Email e Ativar Conta
              </a>
            </div>
            
            <div class="features">
              <h3 style="margin-bottom: 16px; color: #1a1a1a; font-size: 16px;">O que você pode fazer na CopyMaster:</h3>
              <div class="feature-item">
                <div class="feature-icon"></div>
                <div class="feature-text">Gerar copies persuasivas para vendas</div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"></div>
                <div class="feature-text">Criar anúncios para redes sociais</div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"></div>
                <div class="feature-text">Desenvolver emails de marketing</div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"></div>
                <div class="feature-text">Produzir conteúdo para blogs e sites</div>
              </div>
            </div>
            
            <div class="security-note">
              <p><strong>⚠️ Importante:</strong> Este link de confirmação expira em 24 horas. Se você não confirmar seu email neste período, será necessário se cadastrar novamente.</p>
            </div>
            
            <div class="message" style="margin-top: 30px; font-size: 14px; color: #888888;">
              Se você não se cadastrou na CopyMaster, pode ignorar este email com segurança.
              <br><br>
              Caso o botão não funcione, copie e cole este link no seu navegador:<br>
              <a href="${confirmationUrl}" style="color: #3B82F6; word-break: break-all;">${confirmationUrl}</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>CopyMaster</strong> - Transformando ideias em copies que convertem</p>
            <p>
              Precisa de ajuda? Entre em contato: 
              <a href="mailto:suporte@copymaster.app">suporte@copymaster.app</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px;">
              © 2024 CopyMaster. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CopyMaster <noreply@copymaster.app>",
      to: [email],
      subject: "🚀 Confirme seu email e ative sua conta CopyMaster",
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
