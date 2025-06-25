'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const loadingRef = useRef(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      console.log('Initializing auth...')
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          // Don't set loading to false here - wait for onAuthStateChange
        } else if (session) {
          console.log('Initial session loaded:', session.user?.id)
          setUser(session.user)
          setLoading(false)
          loadingRef.current = false
          console.log('Auth initialization complete from getSession')
        } else {
          console.log('No session from getSession, waiting for onAuthStateChange')
          // Don't set loading to false - wait for onAuthStateChange
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Don't set loading to false here - wait for onAuthStateChange
      }
    }

    // Initialize auth
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id, 'loadingRef:', loadingRef.current)
      
      // Update user state
      if (mounted) {
        setUser(session?.user ?? null)
        
        // If we get an initial signed in event while still loading, complete initialization
        if (loadingRef.current && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log('Received auth event while loading, completing initialization')
          setLoading(false)
          loadingRef.current = false
          
        }
      }
      
      // Handle session recovery
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }
      
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
      
      // If signed out, ensure loading is false and user is null
      if (event === 'SIGNED_OUT' && mounted) {
        setUser(null)
        setLoading(false)
        loadingRef.current = false
      }
      
      // Always ensure loading is false after any auth event
      if (mounted && loadingRef.current) {
        setLoading(false)
        loadingRef.current = false
      }
    })

    return () => {
      mounted = false
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
    console.log('Starting sign out process...')
    
    try {
      // Clear user state immediately
      setUser(null)
      
      // Sign out from Supabase and wait for completion
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase sign out error:', error)
        // Still continue with sign out process
      } else {
        console.log('Supabase sign out completed successfully')
      }
      
      // Clear any local storage items that might contain session data
      if (typeof window !== 'undefined') {
        // Clear all Supabase related storage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('supabase')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
    } catch (error) {
      console.error('Sign out error:', error)
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