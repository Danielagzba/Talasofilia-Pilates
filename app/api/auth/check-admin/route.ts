import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[check-admin] No authenticated user:', authError?.message)
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }
    
    console.log('[check-admin] Checking admin status for user:', user.id)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('[check-admin] Database error:', error)
      // Return false instead of 500 to prevent infinite loading
      return NextResponse.json({ 
        isAdmin: false, 
        error: error.message 
      }, { status: 200 })
    }
    
    console.log('[check-admin] Admin status result:', data)
    return NextResponse.json({ isAdmin: data?.is_admin === true })
  } catch (error) {
    console.error('[check-admin] Unexpected error:', error)
    return NextResponse.json({ 
      isAdmin: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 200 })
  }
}