'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Use useMemo to ensure we only create one Supabase client instance
  const supabase = useMemo(() => createClient(), [])
  
  console.log('AuthProvider render - loading:', loading, 'user:', user?.email)

  useEffect(() => {
    let mounted = true;
    
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return;
        
        if (error) {
          console.error('AuthContext: Error getting session:', error)
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('AuthContext: Error checking user session:', error)
        setUser(null)
      } finally {
        if (mounted) {
          console.log('AuthContext: Setting loading to false')
          setLoading(false)
        }
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setUser(session?.user ?? null)
      
      // Send welcome email when user confirms their email
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('welcomed')
          .eq('id', session.user.id)
          .single()
        
        // If user hasn't been welcomed yet, send welcome email
        if (profile && !profile.welcomed) {
          try {
            await fetch('/api/auth/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: session.user.id })
            })
            
            // Mark user as welcomed
            await supabase
              .from('user_profiles')
              .update({ welcomed: true })
              .eq('id', session.user.id)
          } catch (error) {
            console.error('Failed to send welcome email:', error)
          }
        }
      }
    })

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Starting signOut process')
      
      // Clear the user state immediately
      setUser(null)
      
      // Then perform the actual signout
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        // If signout fails, we might need to restore the user state
        // For now, we'll keep it null to prevent showing authenticated content
        throw error
      }
      
      console.log('SignOut completed successfully')
    } catch (error) {
      console.error('Failed to sign out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}