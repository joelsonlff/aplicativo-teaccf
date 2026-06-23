import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../../config/app.config'

export const supabaseAdmin = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
