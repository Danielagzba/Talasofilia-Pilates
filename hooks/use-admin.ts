'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/auth-context'
import { createClient } from '../lib/supabase'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setIsAdmin(data.is_admin || false)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, supabase])

  return { isAdmin, loading }
}