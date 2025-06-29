import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { createServiceSupabaseClient } from '../../../../../../lib/supabase-server'
import { addDays } from 'date-fns'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check authentication with regular client
    const authSupabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
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

    // Use service client for admin operations to bypass RLS
    const supabase = createServiceSupabaseClient()

    // Get request body
    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    // Fetch the package details
    const { data: packageData, error: packageError } = await supabase
      .from('class_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Create a new purchase record
    const purchaseDate = new Date()
    const expiryDate = addDays(purchaseDate, packageData.validity_days)

    const { data, error } = await supabase
      .from('user_purchases')
      .insert({
        user_id: params.id,
        package_id: packageId,
        purchase_date: purchaseDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        classes_remaining: packageData.number_of_classes,
        total_classes: packageData.number_of_classes,
        amount_paid: packageData.price,
        payment_method: 'cash',
        payment_status: 'completed'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error adding credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}