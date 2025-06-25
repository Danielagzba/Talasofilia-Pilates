import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('[Verify Purchase API] Getting recent purchase...')
  
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[Verify Purchase API] User error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Verify Purchase API] Fetching purchase for user:', user.id)
    
    // Get the most recent purchase for this user
    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        class_packages (
          name,
          number_of_classes
        )
      `)
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('[Verify Purchase API] Purchase query error:', error)
      return NextResponse.json({ purchase: null })
    }
    
    console.log('[Verify Purchase API] Purchase found:', data?.id)
    
    return NextResponse.json({ purchase: data })
  } catch (error) {
    console.error('[Verify Purchase API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}