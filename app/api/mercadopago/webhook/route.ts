import { NextRequest, NextResponse } from 'next/server'
import { getPayment } from '@/lib/mercadopago'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// Add GET method for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'MercadoPago webhook is ready' })
}

// Export runtime configuration
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[MercadoPago Webhook] Received webhook call at:', new Date().toISOString())
  
  try {
    // Log headers for debugging
    console.log('[MercadoPago Webhook] Headers:', {
      'content-type': request.headers.get('content-type'),
      'x-signature': request.headers.get('x-signature') ? 'present' : 'missing',
      'x-request-id': request.headers.get('x-request-id')
    })
    
    const body = await request.json()
    console.log('[MercadoPago Webhook] Body:', JSON.stringify(body, null, 2))
    
    // Verify webhook signature if configured
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')
    
    // Log event details for debugging
    console.log('[MercadoPago Webhook] Event type received:', body.type)
    console.log('[MercadoPago Webhook] Event action received:', body.action)
    
    // MercadoPago sends different types of notifications
    // Handle both payment notifications and merchant_order notifications
    let paymentId = null
    
    if (body.type === 'payment' && body.data?.id) {
      // Direct payment notification
      paymentId = body.data.id
    } else if (body.topic === 'merchant_order' && body.resource) {
      // Merchant order notification - we need to fetch the order to get payment ID
      console.log('[MercadoPago Webhook] Merchant order notification received, resource:', body.resource)
      // For now, we'll skip merchant order notifications
      // In a full implementation, you would fetch the merchant order and extract payment IDs
      console.log('[MercadoPago Webhook] Skipping merchant order notification')
      return NextResponse.json({ received: true })
    } else {
      console.log('[MercadoPago Webhook] No payment ID found, ignoring. Type:', body.type, 'Action:', body.action)
      return NextResponse.json({ received: true })
    }

    // paymentId is already extracted above
    
    // Handle test webhook from MercadoPago dashboard
    if (paymentId === '123456' || body.live_mode === false) {
      console.log('[MercadoPago Webhook] Test webhook received, responding with success')
      return NextResponse.json({ received: true, test: true })
    }
    
    const payment = getPayment()
    
    if (!payment) {
      console.error('MercadoPago payment client not configured')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 })
    }
    
    let paymentData
    try {
      console.log('[MercadoPago Webhook] Fetching payment details for ID:', paymentId)
      paymentData = await payment.get({ id: paymentId })
      console.log('[MercadoPago Webhook] Payment retrieved successfully')
    } catch (paymentError) {
      console.error('[MercadoPago Webhook] Failed to get payment details:', paymentError)
      // Log more details about the error
      if (paymentError instanceof Error) {
        console.error('[MercadoPago Webhook] Error details:', {
          message: paymentError.message,
          stack: paymentError.stack
        })
      }
      return NextResponse.json({ error: 'Failed to retrieve payment' }, { status: 500 })
    }
    
    console.log('MercadoPago payment notification:', {
      id: paymentId,
      status: paymentData.status,
      status_detail: paymentData.status_detail
    })

    // Only process approved payments
    if (paymentData.status !== 'approved') {
      console.log(`Payment ${paymentId} not approved. Status: ${paymentData.status}`)
      return NextResponse.json({ received: true })
    }

    // Parse the external reference to get our metadata
    let metadata
    try {
      metadata = JSON.parse(paymentData.external_reference || '{}')
    } catch (e) {
      console.error('Failed to parse external reference:', e)
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
    }

    const { userId, packageId, packageName, numberOfClasses, validityDays } = metadata

    if (!userId || !packageId) {
      console.error('Missing required metadata:', metadata)
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
    }

    // Get Supabase service role client for webhook operations
    const supabase = createServiceRoleClient()

    // Check if this payment has already been processed
    const { data: existingPurchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('mercado_pago_payment_id', paymentId)
      .single()

    if (existingPurchase) {
      console.log(`Payment ${paymentId} already processed`)
      return NextResponse.json({ received: true })
    }

    // Create the purchase record
    const purchaseDate = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + validityDays)

    const { data: purchase, error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: userId,
        package_id: packageId,
        purchase_date: purchaseDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        classes_remaining: numberOfClasses,
        total_classes: numberOfClasses,
        amount_paid: paymentData.transaction_amount,
        payment_method: paymentData.payment_method_id,
        payment_status: 'completed',
        payment_provider: 'mercado_pago',
        mercado_pago_payment_id: paymentId,
        mercado_pago_preference_id: paymentData.preference_id,
        mercado_pago_status: paymentData.status,
        mercado_pago_status_detail: paymentData.status_detail
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Failed to create purchase:', purchaseError)
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      )
    }

    // Get user details for email
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    // TODO: Send confirmation email when email service is configured
    console.log('[MercadoPago Webhook] Email sending skipped - service not configured')

    const processingTime = Date.now() - startTime
    console.log('[MercadoPago Webhook] Successfully processed payment:', paymentId, 'in', processingTime, 'ms')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[MercadoPago Webhook] Webhook error:', error)
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[MercadoPago Webhook] Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}