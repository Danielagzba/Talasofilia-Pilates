import { NextRequest, NextResponse } from 'next/server'
import { getPayment } from '@/lib/mercadopago'
import { createClient } from '@/lib/supabase/server'
import { sendPurchaseConfirmation } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature if configured
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')
    
    // MercadoPago sends different types of notifications
    // We're interested in payment notifications
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ received: true })
    }

    // Get the payment details from MercadoPago
    const paymentId = body.data.id
    const payment = getPayment()
    
    if (!payment) {
      console.error('MercadoPago payment client not configured')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 })
    }
    
    const paymentData = await payment.get({ id: paymentId })
    
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

    // Get Supabase client
    const supabase = await createClient()

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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}