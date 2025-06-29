import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  // Sign out on the server
  await supabase.auth.signOut()
  
  // Create response
  const response = NextResponse.json({ success: true })
  
  // Clear all auth-related cookies
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'sb-auth-token',
    'supabase-auth-token'
  ]
  
  // Get the domain from the request
  const url = new URL(request.url)
  const domain = url.hostname
  
  // Clear cookies with various path and domain combinations
  cookiesToClear.forEach(cookieName => {
    // Clear for current path
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    })
    
    // Clear with domain
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
      domain: domain,
      expires: new Date(0)
    })
    
    // Clear with dot prefix domain (for subdomains)
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
      domain: `.${domain}`,
      expires: new Date(0)
    })
  })
  
  // Also clear any cookies that start with sb- prefix
  request.cookies.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0)
      })
    }
  })
  
  return response
}