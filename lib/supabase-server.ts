import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// For API routes that need authenticated user context
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabase
}

// For webhooks and server-side operations without user context
export function createServiceSupabaseClient() {
  // Use service role key if available, otherwise fall back to anon key
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}