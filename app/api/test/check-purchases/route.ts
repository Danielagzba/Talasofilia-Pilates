import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    // Use service client to bypass RLS
    const supabase = createServiceSupabaseClient()
    
    // Get all purchases from the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: recentPurchases, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        class_packages (
          name
        )
      `)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching purchases:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Also check for MercadoPago specific purchases
    const { data: mpPurchases, error: mpError } = await supabase
      .from('user_purchases')
      .select('id, payment_provider, mercado_pago_payment_id, created_at')
      .eq('payment_provider', 'mercado_pago')
      .order('created_at', { ascending: false })
      .limit(5)
    
    return NextResponse.json({
      total_recent_purchases: recentPurchases?.length || 0,
      recent_purchases: recentPurchases?.map(p => ({
        id: p.id,
        user_id: p.user_id,
        package: p.class_packages?.name || 'Unknown',
        provider: p.payment_provider,
        status: p.payment_status,
        mp_payment_id: p.mercado_pago_payment_id,
        created: p.created_at
      })),
      mercadopago_purchases: {
        total: mpPurchases?.length || 0,
        recent: mpPurchases
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}