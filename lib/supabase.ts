import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('[createClient] Creating client with URL:', url ? 'present' : 'missing', 'Key:', anonKey ? 'present' : 'missing')
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createBrowserClient(url, anonKey)
}