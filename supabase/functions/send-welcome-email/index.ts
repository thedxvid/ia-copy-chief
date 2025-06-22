
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const resendApiKey = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Validar token de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!validateAuthToken(authHeader)) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Obter e sanitizar dados
    const rawBody = await req.json();
    const body = sanitizeInput(rawBody);

    const { email, name } = body;

    // Validar campos obrigatórios
    if (!email || !name) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Rate limiting por email (5 emails por hora)
    if (!checkRateLimit(`email:${email}`, 5, 3600000)) {
      return createErrorResponse('Email rate limit exceeded', 429);
    }

    // Enviar email de boas-vindas de forma segura
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'CopyChief <noreply@iacopychief.com>',
        to: [email],
        subject: 'Bem-vindo ao CopyChief!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bem-vindo ao CopyChief, ${name}!</h2>
            <p>Estamos muito felizes em tê-lo conosco. Você agora tem acesso a:</p>
            <ul>
              <li>✅ Chat com IA especializada em copywriting</li>
              <li>✅ Agentes personalizados para diferentes nichos</li>
              <li>✅ 100.000 tokens mensais para usar</li>
              <li>✅ Ferramentas avançadas de análise</li>
            </ul>
            <p>Para começar, <a href="${Deno.env.get('SUPABASE_URL')}/chat" style="color: #3B82F6;">clique aqui e faça sua primeira conversa</a>.</p>
            <p style="color: #666; font-size: 14px;">
              Se você tiver alguma dúvida, não hesite em nos contatar.
            </p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Error sending email:', errorText);
      return createErrorResponse('Error sending welcome email', 500);
    }

    return createSecureResponse({ success: true });

  } catch (error) {
    console.error('Error in welcome email function:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
