
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
