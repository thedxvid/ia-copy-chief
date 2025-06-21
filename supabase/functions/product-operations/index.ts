
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('=== 🔐 PRODUCT OPERATIONS EDGE FUNCTION (ENHANCED SECURITY) ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let userId: string | null = null;
  let clientIP: string | null = null;
  let userAgent: string | null = null;

  try {
    // Capturar informações de segurança
    clientIP = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    userAgent = req.headers.get('user-agent') || 'unknown';

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

    // Verificar se é admin para limites maiores
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.is_admin || false;
    console.log('👑 Status admin:', isAdmin);

    // Função melhorada para logs de auditoria com validação
    const logSecurityAction = async (action: string, resource: string, metadata?: any, severity: string = 'info') => {
      try {
        // Validação de entrada
        if (!action || typeof action !== 'string' || action.length > 100) {
          console.error('❌ Ação de log inválida:', action);
          return;
        }

        await supabase
          .from('security_audit_logs')
          .insert({
            user_id: userId,
            action,
            resource,
            metadata: metadata || {},
            severity,
            ip_address: clientIP,
            user_agent: userAgent,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.warn('⚠️ Falha ao salvar log de segurança (não crítico):', error);
      }
    };

    // Rate limiting melhorado usando função do banco
    const checkEnhancedRateLimit = async (action: string, maxRequests: number = 30) => {
      try {
        const { data, error } = await supabase.rpc('enhanced_rate_limit_check', {
          p_user_id: userId,
          p_action: action,
          p_max_requests: maxRequests,
          p_window_minutes: 1
        });

        if (error) {
          console.warn('⚠️ Erro no rate limit check, permitindo por segurança:', error);
          return true;
        }

        return data as boolean;
      } catch (error) {
        console.warn('⚠️ Erro crítico no rate limit, permitindo por segurança:', error);
        return true;
      }
    };

    const url = new URL(req.url);
    const path = url.pathname;
    const productId = url.searchParams.get('id');

    // GET - Listar produtos ou buscar produto específico
    if (req.method === 'GET') {
      if (productId) {
        // Buscar produto específico
        console.log('🔍 Buscando produto específico:', productId);
        
        // Validação de entrada para productId
        if (!/^[0-9a-f-]{36}$/i.test(productId)) {
          await logSecurityAction('INVALID_PRODUCT_ID', `product:${productId}`, {
            reason: 'ID de produto inválido',
            provided_id: productId
          }, 'warning');
          
          return new Response(
            JSON.stringify({ 
              error: 'Invalid product ID',
              details: 'ID de produto deve ser um UUID válido'
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        if (!await checkEnhancedRateLimit('GET_PRODUCT', 200)) {
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
          await logSecurityAction('GET_PRODUCT_ERROR', `product:${productId}`, { 
            error: error.message,
            code: error.code
          }, 'warning');
          
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

        await logSecurityAction('GET_PRODUCT', `product:${productId}`, {
          product_name: product.name
        });
        
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
        
        if (!await checkEnhancedRateLimit('GET_PRODUCTS', 200)) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              details: 'Muitas requisições. Aguarde um momento.',
              isAdmin,
              suggestion: 'Tente novamente em alguns segundos'
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
          await logSecurityAction('GET_PRODUCTS_ERROR', 'products', { 
            error: error.message,
            code: error.code
          }, 'error');
          
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

        await logSecurityAction('GET_PRODUCTS', 'products', { 
          count: products?.length || 0 
        });
        
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
      
      if (!await checkEnhancedRateLimit('CREATE_PRODUCT', 30)) {
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

      // Validação rigorosa de entrada
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        await logSecurityAction('INVALID_PRODUCT_DATA', 'products', {
          reason: 'Nome do produto inválido',
          provided_name: name
        }, 'warning');
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid product name',
            details: 'Nome do produto é obrigatório e deve ser uma string não vazia'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!niche || typeof niche !== 'string' || niche.trim().length === 0) {
        await logSecurityAction('INVALID_PRODUCT_DATA', 'products', {
          reason: 'Nicho do produto inválido',
          provided_niche: niche
        }, 'warning');
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid product niche',
            details: 'Nicho do produto é obrigatório e deve ser uma string não vazia'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Limitar tamanho dos campos
      if (name.length > 255 || niche.length > 255 || (sub_niche && sub_niche.length > 255)) {
        await logSecurityAction('INVALID_PRODUCT_DATA', 'products', {
          reason: 'Campos muito longos',
          name_length: name.length,
          niche_length: niche.length,
          sub_niche_length: sub_niche?.length
        }, 'warning');
        
        return new Response(
          JSON.stringify({ 
            error: 'Field too long',
            details: 'Nome, nicho e sub-nicho devem ter no máximo 255 caracteres'
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
          name: name.trim(),
          niche: niche.trim(),
          sub_niche: sub_niche?.trim() || null,
          status
        })
        .select()
        .single();

      if (error) {
        await logSecurityAction('CREATE_PRODUCT_ERROR', 'products', { 
          error: error.message,
          code: error.code,
          productData: { name: name.trim(), niche: niche.trim(), sub_niche, status }
        }, 'error');
        
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

      await logSecurityAction('CREATE_PRODUCT', `product:${product.id}`, { 
        name: product.name, 
        niche: product.niche 
      });
      
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

      // Validação de entrada para productId
      if (!/^[0-9a-f-]{36}$/i.test(productId)) {
        await logSecurityAction('INVALID_PRODUCT_ID', `product:${productId}`, {
          reason: 'ID de produto inválido para atualização',
          provided_id: productId
        }, 'warning');
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid product ID',
            details: 'ID de produto deve ser um UUID válido'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('📝 Atualizando produto:', productId);
      
      if (!await checkEnhancedRateLimit('UPDATE_PRODUCT', 60)) {
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

      // Validar campos se fornecidos
      if (updates.name !== undefined && (!updates.name || typeof updates.name !== 'string' || updates.name.trim().length === 0)) {
        await logSecurityAction('INVALID_UPDATE_DATA', `product:${productId}`, {
          reason: 'Nome inválido na atualização',
          provided_name: updates.name
        }, 'warning');
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid product name',
            details: 'Nome do produto deve ser uma string não vazia'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: product, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        await logSecurityAction('UPDATE_PRODUCT_ERROR', `product:${productId}`, { 
          error: error.message,
          code: error.code,
          updates
        }, 'error');
        
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

      await logSecurityAction('UPDATE_PRODUCT', `product:${productId}`, {
        updated_fields: Object.keys(updates),
        product_name: product.name
      });
      
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

      // Validação de entrada para productId
      if (!/^[0-9a-f-]{36}$/i.test(productId)) {
        await logSecurityAction('INVALID_PRODUCT_ID', `product:${productId}`, {
          reason: 'ID de produto inválido para exclusão',
          provided_id: productId
        }, 'warning');
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid product ID',
            details: 'ID de produto deve ser um UUID válido'
          }),
          { 
            status: 400,
            headers: {  ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('🗑️ Deletando produto:', productId);
      
      if (!await checkEnhancedRateLimit('DELETE_PRODUCT', 40)) {
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

      // Buscar informações do produto antes de deletar para logs
      const { data: productInfo } = await supabase
        .from('products')
        .select('name, niche')
        .eq('id', productId)
        .eq('user_id', userId)
        .single();

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userId);

      if (error) {
        await logSecurityAction('DELETE_PRODUCT_ERROR', `product:${productId}`, { 
          error: error.message,
          code: error.code
        }, 'error');
        
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

      await logSecurityAction('DELETE_PRODUCT', `product:${productId}`, {
        deleted_product: productInfo
      });
      
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
    
    // Log de erro crítico se possível
    if (userId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('security_audit_logs')
          .insert({
            user_id: userId,
            action: 'CRITICAL_ERROR',
            resource: 'product-operations-function',
            metadata: {
              error: error.message,
              stack: error.stack,
              method: req.method,
              url: req.url
            },
            severity: 'critical',
            ip_address: clientIP,
            user_agent: userAgent
          });
      } catch (logError) {
        console.error('💥 Não foi possível salvar log de erro crítico:', logError);
      }
    }
    
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
