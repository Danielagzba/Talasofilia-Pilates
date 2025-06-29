import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const authSupabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = token 
      ? await authSupabase.auth.getUser(token)
      : await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await authSupabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service client to bypass RLS
    const supabase = createServiceSupabaseClient()

    // Get all purchases for the user
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', params.userId)
      .order('purchase_date', { ascending: false })

    if (purchasesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch purchases', 
        details: purchasesError 
      }, { status: 500 })
    }

    // Also check with regular client to see RLS behavior
    const { data: rlsPurchases, error: rlsError } = await authSupabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', params.userId)
      .order('purchase_date', { ascending: false })

    return NextResponse.json({
      serviceClientPurchases: purchases || [],
      regularClientPurchases: rlsPurchases || [],
      rlsError: rlsError?.message || null,
      totalServiceClient: purchases?.length || 0,
      totalRegularClient: rlsPurchases?.length || 0,
      message: 'Debug information for purchases'
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}