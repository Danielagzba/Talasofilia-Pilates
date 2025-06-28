import { NextRequest, NextResponse } from 'next/server'
import { getPayment } from '@/lib/mercadopago'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sendPurchaseConfirmation } from '@/lib/email-service'

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
    
    // MercadoPago sends different types of notifications
    // We're interested in payment notifications
    if (body.type !== 'payment' || !body.data?.id) {
      console.log('[MercadoPago Webhook] Not a payment notification, ignoring')
      return NextResponse.json({ received: true })
    }

    // Get the payment details from MercadoPago
    const paymentId = body.data.id
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

    // Send confirmation email
    try {
      await sendPurchaseConfirmation({
        to: paymentData.payer.email,
        userName: userProfile?.display_name || paymentData.payer.email.split('@')[0],
        packageName: packageName,
        numberOfClasses: numberOfClasses,
        validityDays: validityDays,
        amount: paymentData.transaction_amount,
        purchaseDate: purchaseDate.toLocaleDateString(),
        expiryDate: expiryDate.toLocaleDateString()
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the webhook if email fails
    }

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