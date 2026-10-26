import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  console.log('[Dashboard API] Getting dashboard data...')
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // A separate client per request keeps RLS tied to this caller, never another session.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      }
    )
    
    // Get the current user using the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[Dashboard API] User error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Dashboard API] Fetching data for user:', user.id)
    
    // Fetch active purchases (including those with 0 classes remaining)
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select(`
        *,
        class_packages (
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .gte('expiry_date', new Date().toISOString())
      .gte('classes_remaining', 0)
      .order('expiry_date', { ascending: true })
    
    if (purchasesError) {
      console.error('[Dashboard API] Purchases error:', purchasesError)
      return NextResponse.json({ error: 'Unable to load class packages' }, { status: 503 })
    }
    
    // Fetch upcoming classes
    const { data: bookings, error: bookingsError } = await supabase
      .from('class_bookings')
      .select(`
        *,
        class_schedules (
          class_name,
          class_date,
          start_time,
          instructor_name
        )
      `)
      .eq('user_id', user.id)
      .eq('booking_status', 'confirmed')
    
    if (bookingsError) {
      console.error('[Dashboard API] Bookings error:', bookingsError)
      return NextResponse.json({ error: 'Unable to load upcoming classes' }, { status: 503 })
    }
    
    // Filter for future classes only
    const now = new Date()
    const upcomingClasses = bookings?.filter(booking => {
      if (!booking.class_schedules) return false
      const classDate = new Date(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`)
      return classDate > now
    }) || []
    
    console.log('[Dashboard API] Data fetched successfully')
    
    return NextResponse.json({
      purchases: purchases || [],
      upcomingClasses: upcomingClasses
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[Dashboard API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}