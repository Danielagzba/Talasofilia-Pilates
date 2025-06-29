import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (userProfileError) {
      return NextResponse.json({ error: userProfileError.message }, { status: 404 })
    }

    // Fetch user's class history
    const { data: classHistory, error: historyError } = await supabase
      .from('class_bookings')
      .select(`
        *,
        class_schedules (
          class_name,
          instructor_name,
          class_date,
          start_time,
          end_time
        )
      `)
      .eq('user_id', params.id)
      .order('booked_at', { ascending: false })

    if (historyError) {
      console.error('Error fetching class history:', historyError)
    }

    // Fetch user's purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select(`
        *,
        class_packages (
          name,
          number_of_classes,
          validity_days
        )
      `)
      .eq('user_id', params.id)
      .order('purchase_date', { ascending: false })

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
    }

    return NextResponse.json({
      profile: userProfile,
      classHistory: classHistory || [],
      purchases: purchases || []
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}