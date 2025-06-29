import { createClient } from './supabase'

export async function getAuthHeaders() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    return {}
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authHeaders = await getAuthHeaders()
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })
}