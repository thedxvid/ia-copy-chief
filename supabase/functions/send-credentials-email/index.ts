
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CredentialsEmailRequest {
  email: string;
  name: string;
  temporaryPassword: string;
  isNewUser?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, temporaryPassword, isNewUser }: CredentialsEmailRequest = await req.json();

    console.log(`📧 Enviando email de credenciais para: ${email} (Novo usuário: ${isNewUser})`);

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Suas Credenciais de Acesso - CopyChief</title>
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
            background: linear-gradient(135deg, #10b981, #059669);
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
          
          .payment-success {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            animation: fadeIn 1s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .payment-success h2 {
            font-size: 1.4em;
            margin-bottom: 10px;
          }
          
          .payment-success p {
            font-size: 1em;
            opacity: 0.9;
          }
          
          .credentials-box {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 35px;
            border-left: 4px solid #10b981;
            text-align: left;
          }
          
          .credential-item {
            margin-bottom: 20px;
          }
          
          .credential-item:last-child {
            margin-bottom: 0;
          }
          
          .credential-label {
            color: #555;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .credential-value {
            color: #333;
            font-size: 16px;
            font-weight: 600;
            padding: 12px 16px;
            background: white;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            font-family: 'Courier New', monospace;
            word-break: break-all;
          }
          
          .password-highlight {
            background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
            border-color: #f59e0b !important;
            color: #92400e !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            text-align: center;
            letter-spacing: 2px;
          }
          
          .access-button {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 16px 40px;
            font-size: 1.1em;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 25px;
            min-width: 200px;
            text-decoration: none;
            display: inline-block;
          }
          
          .access-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
            background: linear-gradient(135deg, #059669, #047857);
          }
          
          .instructions {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: left;
          }
          
          .instructions h3 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .instructions p {
            color: #1f2937;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .instructions p:last-child {
            margin-bottom: 0;
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
          
          .footer {
            color: #888;
            font-size: 0.9em;
            margin-top: 30px;
            line-height: 1.5;
          }
          
          .footer a {
            color: #10b981;
            text-decoration: none;
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
            
            .credentials-box {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">
            <svg viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          
          ${isNewUser ? `
          <div class="payment-success">
            <h2>🎉 Pagamento Aprovado!</h2>
            <p>Sua conta foi criada automaticamente e sua assinatura está ativa.</p>
          </div>
          ` : ''}
          
          <h1>${isNewUser ? 'Bem-vindo ao CopyChief!' : 'Acesso ativado!'}</h1>
          <p class="subtitle">
            ${isNewUser 
              ? `Olá, ${name}! Sua conta foi criada com sucesso após a aprovação do pagamento. Use os dados abaixo para fazer seu primeiro login na plataforma.`
              : `Olá, ${name}! Suas credenciais de acesso estão prontas. Use os dados abaixo para fazer seu primeiro login na plataforma.`
            }
          </p>
          
          <div class="credentials-box">
            <div class="credential-item">
              <div class="credential-label">Email de Login</div>
              <div class="credential-value">${email}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Senha Temporária</div>
              <div class="credential-value password-highlight">${temporaryPassword}</div>
            </div>
          </div>
          
          <a href="https://iacopychief.com/auth" class="access-button">
            🚀 Acessar Plataforma
          </a>
          
          <div class="instructions">
            <h3>📋 Instruções de Primeiro Acesso:</h3>
            <p>1. Clique no botão "Acessar Plataforma" acima</p>
            <p>2. Use seu email e a senha temporária fornecida</p>
            <p>3. Após o login, você será direcionado para alterar sua senha</p>
            <p>4. Escolha uma senha segura de sua preferência</p>
            <p>5. Pronto! Agora você pode acessar a plataforma normalmente</p>
          </div>
          
          <div class="security-note">
            <p><strong>🔒 Importante:</strong> Por questões de segurança, você deve alterar esta senha temporária no seu primeiro acesso. Guarde bem suas credenciais!</p>
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
              Este email contém informações confidenciais. Se você recebeu por engano, pode ignorá-lo com segurança.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CopyChief <noreply@iacopychief.com>",
      to: [email],
      subject: isNewUser ? "🎉 Pagamento Aprovado - Sua conta CopyChief está pronta!" : "🔑 Suas credenciais de acesso - CopyChief",
      html: emailHtml,
    });

    console.log("✅ Email de credenciais enviado com sucesso:", emailResponse);

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
    console.error("❌ Erro ao enviar email de credenciais:", error);
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
