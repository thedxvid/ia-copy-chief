
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('=== 🔐 PRODUCT OPERATIONS EDGE FUNCTION ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let userId: string | null = null;

  try {
    // Validar método HTTP
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          details: 'Apenas GET, POST, PUT, DELETE são permitidos'
        }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar token de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Token de autenticação ausente ou inválido');
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'Token de autenticação requerido'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar usuário
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Usuário não autenticado:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token',
          details: 'Token de autenticação inválido'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    userId = user.id;
    console.log('✅ Usuário autenticado:', userId);

    // Logs de auditoria
    const logAction = async (action: string, resource: string, metadata?: any) => {
      try {
        await supabase
          .from('security_logs')
          .insert({
            user_id: userId,
            action,
            resource,
            metadata,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.warn('⚠️ Falha ao salvar log (não crítico):', error);
      }
    };

    // Rate limiting simples
    const checkRateLimit = async (action: string, maxRequests: number = 30) => {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      
      const { data: recentLogs, error } = await supabase
        .from('security_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('action', action)
        .gte('created_at', oneMinuteAgo);

      if (error) {
        console.warn('⚠️ Erro ao verificar rate limit:', error);
        return true; // Permitir em caso de erro
      }

      return (recentLogs?.length || 0) < maxRequests;
    };

    const url = new URL(req.url);
    const path = url.pathname;
    const productId = url.searchParams.get('id');

    // GET - Listar produtos ou buscar produto específico
    if (req.method === 'GET') {
      if (productId) {
        // Buscar produto específico
        console.log('🔍 Buscando produto específico:', productId);
        
        if (!await checkRateLimit('GET_PRODUCT', 60)) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              details: 'Muitas requisições. Aguarde um momento.'
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('user_id', userId)
          .single();

        if (error) {
          await logAction('GET_PRODUCT_ERROR', `product:${productId}`, { error: error.message });
          return new Response(
            JSON.stringify({ 
              error: 'Product not found',
              details: 'Produto não encontrado ou sem permissão'
            }),
            { 
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        await logAction('GET_PRODUCT', `product:${productId}`);
        
        return new Response(
          JSON.stringify({ data: product }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Listar todos os produtos
        console.log('📋 Listando produtos do usuário');
        
        if (!await checkRateLimit('GET_PRODUCTS', 30)) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              details: 'Muitas requisições. Aguarde um momento.'
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          await logAction('GET_PRODUCTS_ERROR', 'products', { error: error.message });
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch products',
              details: 'Erro ao buscar produtos'
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        await logAction('GET_PRODUCTS', 'products', { count: products?.length || 0 });
        
        return new Response(
          JSON.stringify({ data: products || [] }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // POST - Criar novo produto
    if (req.method === 'POST') {
      console.log('➕ Criando novo produto');
      
      if (!await checkRateLimit('CREATE_PRODUCT', 10)) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            details: 'Muitas criações de produto. Aguarde um momento.'
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const body = await req.json();
      const { name, niche, sub_niche, status = 'draft' } = body;

      if (!name || !niche) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields',
            details: 'Nome e nicho são obrigatórios'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name,
          niche,
          sub_niche,
          status
        })
        .select()
        .single();

      if (error) {
        await logAction('CREATE_PRODUCT_ERROR', 'products', { 
          error: error.message,
          productData: { name, niche, sub_niche, status }
        });
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create product',
            details: 'Erro ao criar produto'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      await logAction('CREATE_PRODUCT', `product:${product.id}`, { name, niche });
      
      return new Response(
        JSON.stringify({ data: product }),
        { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // PUT - Atualizar produto
    if (req.method === 'PUT') {
      if (!productId) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing product ID',
            details: 'ID do produto é obrigatório para atualização'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('📝 Atualizando produto:', productId);
      
      if (!await checkRateLimit('UPDATE_PRODUCT', 20)) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            details: 'Muitas atualizações. Aguarde um momento.'
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const body = await req.json();
      const updates = body;

      // Remover campos que não devem ser atualizados
      delete updates.id;
      delete updates.user_id;
      delete updates.created_at;

      const { data: product, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        await logAction('UPDATE_PRODUCT_ERROR', `product:${productId}`, { 
          error: error.message,
          updates
        });
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update product',
            details: 'Erro ao atualizar produto ou produto não encontrado'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      await logAction('UPDATE_PRODUCT', `product:${productId}`, updates);
      
      return new Response(
        JSON.stringify({ data: product }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // DELETE - Deletar produto
    if (req.method === 'DELETE') {
      if (!productId) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing product ID',
            details: 'ID do produto é obrigatório para exclusão'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('🗑️ Deletando produto:', productId);
      
      if (!await checkRateLimit('DELETE_PRODUCT', 10)) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            details: 'Muitas exclusões. Aguarde um momento.'
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userId);

      if (error) {
        await logAction('DELETE_PRODUCT_ERROR', `product:${productId}`, { error: error.message });
        return new Response(
          JSON.stringify({ 
            error: 'Failed to delete product',
            details: 'Erro ao deletar produto ou produto não encontrado'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      await logAction('DELETE_PRODUCT', `product:${productId}`);
      
      return new Response(
        JSON.stringify({ message: 'Product deleted successfully' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Method not implemented',
        details: 'Método não implementado'
      }),
      { 
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NA FUNÇÃO PRODUCT OPERATIONS:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
