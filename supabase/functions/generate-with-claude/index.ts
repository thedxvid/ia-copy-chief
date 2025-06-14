
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClaudeRequest {
  prompt: string;
  feature: string;
  maxTokens?: number;
}

const TOKEN_ESTIMATES = {
  'generate_copy_short': 2000,
  'generate_copy_long': 8000,
  'optimize_copy': 3000,
  'brainstorm_ideas': 1500,
  'generate_headlines': 1200,
  'rewrite_copy': 2500,
  'analyze_competitor': 4000,
  'chat_message': 1000,
  'custom_agent': 2000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { prompt, feature, maxTokens = 4000 }: ClaudeRequest = await req.json()

    if (!prompt || !feature) {
      return new Response(JSON.stringify({ error: 'Prompt e feature são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Estimar tokens necessários
    const estimatedTokens = TOKEN_ESTIMATES[feature as keyof typeof TOKEN_ESTIMATES] || 2000

    // Verificar se tem tokens suficientes
    const { data: tokensData, error: tokensError } = await supabaseClient.rpc('get_available_tokens', {
      p_user_id: user.id
    })

    if (tokensError || !tokensData || tokensData.length === 0) {
      return new Response(JSON.stringify({ error: 'Erro ao verificar tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const availableTokens = tokensData[0].total_available

    if (availableTokens < estimatedTokens) {
      return new Response(JSON.stringify({ 
        error: 'INSUFFICIENT_TOKENS',
        requiredTokens: estimatedTokens,
        availableTokens: availableTokens
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Chamar Claude API
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'Chave da API Anthropic não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erro da API Claude:', errorData)
      return new Response(JSON.stringify({ error: 'Erro ao gerar conteúdo' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const claudeData = await response.json()

    // Consumir tokens baseado no uso real
    const actualTokens = claudeData.usage.input_tokens + claudeData.usage.output_tokens

    const { data: consumeResult, error: consumeError } = await supabaseClient.rpc('consume_tokens', {
      p_user_id: user.id,
      p_tokens_used: actualTokens,
      p_feature_used: feature,
      p_prompt_tokens: claudeData.usage.input_tokens,
      p_completion_tokens: claudeData.usage.output_tokens
    })

    if (consumeError || !consumeResult) {
      console.error('Erro ao consumir tokens:', consumeError)
      // Ainda retorna o resultado, mas log o erro
    }

    return new Response(JSON.stringify({
      content: claudeData.content[0].text,
      tokensUsed: actualTokens,
      promptTokens: claudeData.usage.input_tokens,
      completionTokens: claudeData.usage.output_tokens
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
