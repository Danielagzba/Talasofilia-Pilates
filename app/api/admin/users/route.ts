import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Use service role to get auth.users data
    const serviceSupabase = createServiceRoleClient()
    
    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }
    
    // Get auth users to get email addresses
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      // Continue without emails rather than failing completely
    }
    
    // Create maps for user data from auth
    const emailMap = new Map()
    const authDisplayNameMap = new Map()
    authData?.users?.forEach(user => {
      emailMap.set(user.id, user.email)
      // Get display name from user metadata
      const displayName = user.user_metadata?.display_name || 
                         user.user_metadata?.full_name || 
                         user.user_metadata?.name
      if (displayName) {
        authDisplayNameMap.set(user.id, displayName)
      }
    })
    
    // Get all user IDs
    const userIds = profiles.map(p => p.id)
    
    // Fetch purchases for all users
    const { data: allPurchases } = await supabase
      .from('user_purchases')
      .select(`
        *,
        class_packages (
          name
        )
      `)
      .in('user_id', userIds)
    
    // Fetch bookings for all users
    const { data: allBookings } = await supabase
      .from('class_bookings')
      .select(`
        *,
        class_schedules (
          class_name,
          class_date,
          start_time
        )
      `)
      .in('user_id', userIds)
    
    // Combine all data
    const usersWithData = profiles.map(profile => {
      const email = emailMap.get(profile.id)
      const authDisplayName = authDisplayNameMap.get(profile.id)
      
      // Priority: auth display name > profile display name > email username
      const displayName = authDisplayName || profile.display_name || email?.split('@')[0] || 'Unknown User'
      
      return {
        ...profile,
        email,
        display_name: displayName, // Use auth display name if available
        auth_display_name: authDisplayName, // Keep track of auth display name
        user_purchases: allPurchases?.filter(p => p.user_id === profile.id) || [],
        class_bookings: allBookings?.filter(b => b.user_id === profile.id) || []
      }
    })
    
    return NextResponse.json({ users: usersWithData })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}