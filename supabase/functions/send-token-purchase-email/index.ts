
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenPurchaseEmailRequest {
  email: string;
  name: string;
  tokensAdded: number;
  amountPaid: number;
  newTotalTokens: number;
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { email, name, tokensAdded, amountPaid, newTotalTokens, orderId }: TokenPurchaseEmailRequest = await req.json();

    console.log('📧 Enviando email de confirmação de compra:', {
      email,
      tokensAdded,
      amountPaid,
      orderId
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tokens Creditados com Sucesso!</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 20px; }
            .success-icon { text-align: center; margin-bottom: 30px; }
            .success-icon span { font-size: 60px; }
            .purchase-details { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border-left: 4px solid #10b981; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .detail-label { color: #6b7280; font-weight: 500; }
            .detail-value { color: #111827; font-weight: 600; }
            .tokens-highlight { background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px; font-weight: bold; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Compra Confirmada!</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">
                <span>✅</span>
              </div>
              
              <h2 style="text-align: center; color: #111827; margin-bottom: 16px;">
                Olá, ${name || 'Cliente'}!
              </h2>
              
              <p style="text-align: center; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Sua compra de tokens foi processada com sucesso! Os tokens já foram creditados em sua conta.
              </p>
              
              <div class="purchase-details">
                <h3 style="margin-top: 0; color: #111827;">📊 Detalhes da Compra</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Tokens Adicionados:</span>
                  <span class="detail-value tokens-highlight">${tokensAdded.toLocaleString('pt-BR')}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Valor Pago:</span>
                  <span class="detail-value">R$ ${amountPaid.toFixed(2)}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Total de Tokens na Conta:</span>
                  <span class="detail-value">${newTotalTokens.toLocaleString('pt-BR')}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">ID do Pedido:</span>
                  <span class="detail-value">#${orderId.slice(0, 8)}</span>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="https://dcnjjhavlvotzpwburvw.supabase.co" class="cta-button">
                  🚀 Acessar Plataforma
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                <strong>🔥 Dica:</strong> Agora você pode usar seus novos tokens para gerar ainda mais conteúdos incríveis com nossa IA!
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Se você tiver alguma dúvida ou precisar de suporte, não hesite em nos contatar.
              </p>
            </div>
            
            <div class="footer">
              <p>Este email foi enviado automaticamente pelo sistema IACopyChief.</p>
              <p>Se você não fez esta compra, entre em contato conosco imediatamente.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'IACopyChief <noreply@iacopychief.com>',
      to: [email],
      subject: '🎉 Tokens creditados com sucesso - IACopyChief',
      html: emailHtml,
    });

    console.log('✅ Email enviado com sucesso:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      messageId: emailResponse.data?.id,
      email: email
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  }
});
