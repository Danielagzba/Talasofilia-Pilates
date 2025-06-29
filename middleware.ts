import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only handle special cases that need server-side redirects
  // Let the client-side handle most auth logic
  
  // Special handling for checkout success/pending pages
  const isCheckoutReturn = request.nextUrl.pathname.startsWith('/dashboard/checkout/')
  
  // For checkout return pages, we'll let the client-side handle auth
  // The page itself will check for auth and redirect if needed
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}