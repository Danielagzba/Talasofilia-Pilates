'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

async function startRecovery() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const isRecovery = params.get('type') === 'recovery' && !params.has('error')
  if (params.size) window.history.replaceState(null, '', window.location.pathname)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!isRecovery || !accessToken || !refreshToken || !url || !key) return null

  try {
    const client = createClient(url, key, {
      auth: {
        storageKey: 'talasofilia.password-recovery',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    return !error && data.session ? client : null
  } catch {
    return null
  }
}

export default function ResetPasswordPage() {
  const recovery = useRef<Promise<ReturnType<typeof createClient> | null> | null>(null)
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    recovery.current ??= startRecovery()
    let active = true
    void recovery.current.then(recoveryClient => {
      if (!active) return
      setClient(recoveryClient)
      setStatus(recoveryClient ? 'ready' : 'invalid')
    })
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client || saving) return
    if (password !== confirmation) {
      setError('The passwords don’t match.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const { error } = await client.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      setPassword('')
      setConfirmation('')
      setStatus('done')
      await client.auth.signOut({ scope: 'local' })
    } catch {
      setError('Unable to update your password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="space-y-6 bg-stone-100 p-8">
        <h1 className="font-serif text-4xl">Set a new password</h1>
        {status === 'checking' && <p role="status">Checking your recovery link…</p>}
        {status === 'invalid' && (
          <p role="status">This recovery link is invalid or expired. <Link className="underline" href="/forgot-password">Request a new link</Link>.</p>
        )}
        {status === 'done' && (
          <p role="status">Your password was updated. <Link className="underline" href="/login">Back to sign in</Link>.</p>
        )}
        {status === 'ready' && (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} />
            </div>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</Button>
          </form>
        )}
      </div>
    </main>
  )
}
