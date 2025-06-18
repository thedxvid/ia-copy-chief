
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
  checkoutUrl?: string;
  isActivatedUser?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, checkoutUrl, isActivatedUser }: WelcomeEmailRequest = await req.json();

    const finalCheckoutUrl = checkoutUrl || "https://pay.kiwify.com.br/nzX4lAh";

    // Template específico para usuários ativados pelo admin
    const activatedUserTemplate = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao CopyMaster</title>
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
            
            .content {
              padding: 40px 30px;
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
            }
            
            .footer {
              background-color: #1a1a1a;
              padding: 30px;
              text-align: center;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CM</div>
              <h1>🎉 Sua conta foi ativada!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px;">Acesso liberado por 30 dias com 25.000 tokens</p>
            </div>
            
            <div class="content">
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1a1a1a;">
                Olá, ${name || 'Usuário'}! 👋
              </div>
              
              <div style="font-size: 16px; color: #666666; margin-bottom: 30px; line-height: 1.6;">
                Ótimas notícias! Sua conta no CopyMaster foi ativada com sucesso.
                <br><br>
                <strong>✅ Sua conta está pronta para uso!</strong> Você já pode acessar a plataforma e começar a criar copies incríveis.
              </div>
              
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 24px; margin: 30px 0; border-left: 4px solid #3B82F6;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;"><strong>25.000 tokens mensais</strong> incluídos</div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;"><strong>30 dias</strong> de acesso total</div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;">Agentes IA especializados em copywriting</div>
                </div>
                <div style="display: flex; align-items: center;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;">Biblioteca com +1.000 copys vencedoras</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="https://copymaster.app" class="cta-button">
                  🚀 Acessar Plataforma Agora
                </a>
              </div>
              
              <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #166534; font-size: 14px; margin: 0;">
                  <strong>🎯 Dica Pro:</strong> Comece explorando nossos agentes especializados no Dashboard. Eles foram treinados para criar copies que realmente convertem!
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>CopyMaster</strong> - Transformando ideias em copies que convertem</p>
              <p>
                Precisa de ajuda? Entre em contato: 
                <a href="mailto:suporte@copymaster.app" style="color: #3B82F6;">suporte@copymaster.app</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px;">
                © 2024 CopyMaster. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
    `;

    // Template padrão para usuários normais
    const standardTemplate = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao CopyMaster</title>
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
            
            .content {
              padding: 40px 30px;
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
            }
            
            .footer {
              background-color: #1a1a1a;
              padding: 30px;
              text-align: center;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CM</div>
              <h1>Bem-vindo ao CopyMaster!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px;">Sua jornada para copies que convertem começa agora</p>
            </div>
            
            <div class="content">
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1a1a1a;">
                Olá, ${name || 'Usuário'}! 👋
              </div>
              
              <div style="font-size: 16px; color: #666666; margin-bottom: 30px; line-height: 1.6;">
                Parabéns por confirmar seu email! Agora você está a apenas um passo de transformar suas vendas com nossa IA de copywriting.
                <br><br>
                <strong>Complete sua assinatura agora</strong> e tenha acesso imediato a:
              </div>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;">Agentes IA especializados em copywriting</div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;">Geração automática de ofertas irresistíveis</div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;">Biblioteca com +1.000 copys vencedoras</div>
                </div>
                <div style="display: flex; align-items: center;">
                  <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; margin-right: 12px;"></div>
                  <div style="color: #374151; font-size: 14px;">Suporte prioritário VIP</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${finalCheckoutUrl}" class="cta-button">
                  🚀 Finalizar Assinatura Agora
                </a>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>⚡ Oferta Limitada:</strong> Apenas R$ 97/mês (valor normal R$ 1.132/mês). Esta promoção é válida apenas para novos usuários e pode acabar a qualquer momento.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>CopyMaster</strong> - Transformando ideias em copies que convertem</p>
              <p>
                Precisa de ajuda? Entre em contato: 
                <a href="mailto:suporte@copymaster.app" style="color: #3B82F6;">suporte@copymaster.app</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px;">
                © 2024 CopyMaster. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
    `;

    const emailSubject = isActivatedUser 
      ? "🎉 Sua conta CopyMaster foi ativada com sucesso!"
      : "🎉 Bem-vindo ao CopyMaster! Complete sua assinatura";

    const emailHtml = isActivatedUser ? activatedUserTemplate : standardTemplate;

    const emailResponse = await resend.emails.send({
      from: "CopyMaster <noreply@copymaster.app>",
      to: [email],
      subject: emailSubject,
      html: emailHtml,
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
