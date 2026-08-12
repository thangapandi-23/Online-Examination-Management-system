import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ujvezhaedmiftxrcryfd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NON_oOkA6x3VeYEB4xry8Q_9-9EYXg2'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Secondary client for creating new accounts without changing the current logged-in Admin session
export const createSecondaryAuthClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}
