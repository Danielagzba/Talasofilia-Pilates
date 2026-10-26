'use client'

import { useState } from 'react'
import Script from 'next/script'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { appleErrorMessage, signInWithApple, type AppleSDK } from '@/lib/apple-auth'

declare global {
  interface Window { AppleID?: AppleSDK }
}

export function AppleSignIn({ disabled, onBusyChange, onSuccess }: {
  disabled: boolean
  onBusyChange(busy: boolean): void
  onSuccess(): void
}) {
  const [ready, setReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    if (busy || disabled || !window.AppleID) return
    setError(null)
    setBusy(true)
    onBusyChange(true)
    try {
      await signInWithApple(createClient(), window.AppleID, window.location.origin)
      onSuccess()
    } catch (failure) {
      setError(appleErrorMessage(failure))
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        onReady={() => setReady(true)}
        onError={() => setLoadFailed(true)}
      />
      <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-stone-300" />or<span className="h-px flex-1 bg-stone-300" />
      </div>
      <button type="button" onClick={connect} disabled={disabled || busy || !ready}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-base font-medium text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        aria-busy={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.05 12.54c.03 3.14 2.75 4.18 2.78 4.2-.02.07-.44 1.49-1.44 2.96-.87 1.27-1.78 2.54-3.2 2.57-1.39.03-1.84-.83-3.43-.83-1.59 0-2.09.8-3.4.86-1.37.05-2.41-1.38-3.29-2.64C3.28 17.08 1.9 12.37 3.74 9.2c.91-1.58 2.54-2.58 4.31-2.61 1.35-.03 2.62.92 3.44.92.82 0 2.36-1.14 3.98-.97.68.03 2.59.27 3.81 2.06-.1.06-2.28 1.33-2.23 3.94M14.44 4.8c.73-.88 1.23-2.11 1.1-3.33-1.06.04-2.35.7-3.11 1.58-.68.78-1.28 2.03-1.12 3.22 1.18.09 2.39-.6 3.13-1.47" /></svg>
        )}
        {busy ? 'Connecting to Apple…' : 'Continue with Apple'}
      </button>
      {loadFailed && <p role="alert" className="text-sm text-red-700">Apple sign-in could not load. Refresh to try again, or use your email and password.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <p className="text-xs text-muted-foreground">Apple creates an account on your first visit and signs you in on future visits. Already have an account? Connect Apple from the iPhone app’s My profile first to keep your bookings and credits, especially if you choose Hide My Email.</p>
    </div>
  )
}
