import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../../config/app.config'

// Cliente criado sob demanda: o Supabase é opcional (só o upload de mídia
// depende dele). Sem configuração, o restante da API funciona normalmente.

let client: SupabaseClient | null = null

export function isStorageConfigured(): boolean {
  return Boolean(supabaseConfig.url && supabaseConfig.serviceRoleKey)
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isStorageConfigured()) {
    throw new Error('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }
  if (!client) {
    client = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return client
}
