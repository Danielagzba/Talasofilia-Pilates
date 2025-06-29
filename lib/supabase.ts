import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  // Return singleton instance if it already exists
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('[createClient] Creating singleton client with URL:', url ? 'present' : 'missing', 'Key:', anonKey ? 'present' : 'missing')
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Create and store the singleton instance
  supabaseInstance = createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: true,
      storageKey: 'supabase.auth.token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
  
  return supabaseInstance
}