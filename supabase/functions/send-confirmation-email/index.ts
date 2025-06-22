
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
        <title>Confirme seu Email - CopyChief</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 50px 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideUp 0.8s ease-out;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4285f4, #1a73e8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          .icon svg {
            width: 40px;
            height: 40px;
            fill: white;
          }
          
          h1 {
            color: #333;
            font-size: 2.2em;
            margin-bottom: 15px;
            font-weight: 600;
          }
          
          .subtitle {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 35px;
            line-height: 1.6;
          }
          
          .email-info {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 35px;
            border-left: 4px solid #4285f4;
          }
          
          .email-info p {
            color: #555;
            margin-bottom: 8px;
          }
          
          .email-address {
            font-weight: 600;
            color: #4285f4;
            font-size: 1.1em;
          }
          
          .confirm-button {
            background: linear-gradient(135deg, #4285f4, #1a73e8);
            color: white;
            border: none;
            padding: 16px 40px;
            font-size: 1.1em;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 25px;
            min-width: 200px;
            text-decoration: none;
            display: inline-block;
          }
          
          .confirm-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(66, 133, 244, 0.4);
            background: linear-gradient(135deg, #1a73e8, #1557b0);
          }
          
          .features {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
            text-align: left;
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
            background: linear-gradient(135deg, #4285f4, #1a73e8);
            border-radius: 50%;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .feature-text {
            color: #374151;
            font-size: 14px;
          }
          
          .footer {
            color: #888;
            font-size: 0.9em;
            margin-top: 30px;
            line-height: 1.5;
          }
          
          .footer a {
            color: #4285f4;
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
              padding: 40px 25px;
              margin: 10px;
            }
            
            h1 {
              font-size: 1.8em;
            }
            
            .subtitle {
              font-size: 1em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">
            <svg viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          
          <h1>Confirme seu cadastro</h1>
          <p class="subtitle">Estamos quase terminando! Clique no botão abaixo para confirmar seu email e ativar sua conta CopyChief.</p>
          
          <div class="email-info">
            <p>Confirmação solicitada para:</p>
            <p class="email-address">${email}</p>
          </div>
          
          <a href="${confirmationUrl}" class="confirm-button">
            ✨ Confirmar Email e Ativar Conta
          </a>
          
          <div class="features">
            <h3 style="margin-bottom: 16px; color: #1a1a1a; font-size: 16px; text-align: center;">O que você pode fazer na CopyChief:</h3>
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
          
          <div class="footer">
            <p><strong>CopyChief</strong> - Transformando ideias em copies que convertem</p>
            <p>
              Precisa de ajuda? Entre em contato: 
              <a href="mailto:suporte@iacopychief.com">suporte@iacopychief.com</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px;">
              © 2024 CopyChief. Todos os direitos reservados.
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              Se você não se cadastrou na CopyChief, pode ignorar este email com segurança.
              <br><br>
              Caso o botão não funcione, copie e cole este link no seu navegador:<br>
              <a href="${confirmationUrl}" style="color: #4285f4; word-break: break-all;">${confirmationUrl}</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CopyChief <noreply@iacopychief.com>",
      to: [email],
      subject: "🚀 Confirme seu email e ative sua conta CopyChief",
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
