
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // VERIFICAÇÃO DE ADMINISTRADOR - ADICIONADA PARA SEGURANÇA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter usuário atual
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário é administrador
    const { data: isAdmin, error: isAdminError } = await supabaseAdmin
      .rpc('is_admin', { p_user_id: user.id });

    if (isAdminError || !isAdmin) {
      console.log('Acesso negado para usuário:', user.email, 'Admin status:', isAdmin);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Recurso restrito a administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verificado:', user.email, 'procedendo com busca de emails');

    const { user_ids } = await req.json()

    if (!user_ids || !Array.isArray(user_ids)) {
      throw new Error('user_ids array is required')
    }

    console.log('Buscando emails para usuários:', user_ids.length)

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }

    const filteredUsers = users.users
      .filter(user => user_ids.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email
      }))

    console.log('Emails encontrados:', filteredUsers.length)

    return new Response(
      JSON.stringify(filteredUsers),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
