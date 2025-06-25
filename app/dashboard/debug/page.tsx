'use client'

import { useAuth } from '../../../contexts/auth-context'
import { useAdmin } from '../../../hooks/use-admin'
import { createClient } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [session, setSession] = useState<any>(null)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setSupabaseError(error.message)
        } else {
          setSession(data.session)
        }
      } catch (error) {
        setSupabaseError(String(error))
      }
    }
    checkSession()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Information</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Auth Context State:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ 
              user: user?.email, 
              authLoading,
              userId: user?.id 
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-semibold">Admin Hook State:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ isAdmin, adminLoading }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-semibold">Direct Session Check:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ 
              session: session ? 'Active' : 'None',
              sessionUser: session?.user?.email,
              supabaseError 
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-semibold">Environment:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ 
              hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
              hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}