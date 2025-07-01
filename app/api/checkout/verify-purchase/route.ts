import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: Request) {
  console.log('[Verify Purchase API] Getting recent purchase...')
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = token 
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[Verify Purchase API] User error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
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
    
    if (error) {
      console.error('[Verify Purchase API] Purchase query error:', error)
      return NextResponse.json({ purchase: null }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    }
    
    // Check if we got any results
    if (!data || data.length === 0) {
      console.log('[Verify Purchase API] No purchase found yet for user:', user.id)
      return NextResponse.json({ purchase: null }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    }
    
    // Return the first purchase
    const purchase = data[0]
    
    console.log('[Verify Purchase API] Purchase found:', purchase.id)
    
    return NextResponse.json({ purchase }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('[Verify Purchase API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}