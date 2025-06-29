import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  // For server-side operations, use the service role key if needed
  // Otherwise, use the anon key
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Don't persist on server
        autoRefreshToken: false,
      }
    }
  )
}