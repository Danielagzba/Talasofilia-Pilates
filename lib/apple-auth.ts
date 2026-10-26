import type { SupabaseClient } from '@supabase/supabase-js'

export const APPLE_CLIENT_ID = 'com.talasofiliapilates.web'

export interface AppleResponse {
  authorization: { id_token: string; state: string }
}

export interface AppleSDK {
  auth: {
    init(options: { clientId: string; scope: string; redirectURI: string; state: string; nonce: string; usePopup: boolean }): void
    signIn(): Promise<AppleResponse>
  }
}

export function safeAuthDestination(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\\\s]/.test(value)) return '/dashboard'
  const destination = new URL(value, 'https://studio.example')
  return destination.origin === 'https://studio.example' ? destination.pathname + destination.search + destination.hash : '/dashboard'
}

export function appleErrorMessage(error: unknown): string | null {
  const code = typeof error === 'object' && error !== null && 'error' in error ? error.error : undefined
  if (code === 'popup_closed_by_user' || code === 'user_cancelled_authorize') return null
  if (code === 'popup_blocked_by_browser') return 'Please allow the Apple sign-in popup and try again.'
  return 'Apple sign-in could not be completed. Please try again or use your email and password.'
}

/** Apple validates the account; Supabase validates its ID token and raw nonce. */
export async function signInWithApple(client: SupabaseClient, apple: AppleSDK, origin: string) {
  const nonce = crypto.randomUUID()
  const state = crypto.randomUUID()
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
  apple.auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: 'email',
    redirectURI: new URL('/login', origin).href,
    state,
    nonce: hashedNonce,
    usePopup: true,
  })
  const response = await apple.auth.signIn()
  if (response.authorization?.state !== state || !response.authorization.id_token) throw new Error('Invalid Apple response')
  const { data, error } = await client.auth.signInWithIdToken({
    provider: 'apple', token: response.authorization.id_token, nonce,
  })
  if (error) throw error
  if (!data.session) throw new Error('Apple sign-in did not return a session')
  return data.session
}
