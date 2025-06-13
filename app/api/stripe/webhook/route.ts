import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid') {
          const metadata = session.metadata!
          
          // Calculate expiry date
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + parseInt(metadata.validityDays))

          // Create the purchase record
          const { data: purchase, error: purchaseError } = await supabase
            .from('user_purchases')
            .insert({
              user_id: metadata.userId,
              package_id: metadata.packageId,
              classes_remaining: parseInt(metadata.numberOfClasses),
              total_classes: parseInt(metadata.numberOfClasses),
              amount_paid: session.amount_total! / 100, // Convert from cents
              payment_method: 'stripe',
              payment_status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string,
              expiry_date: expiryDate.toISOString(),
            })
            .select()
            .single()

          if (purchaseError) {
            console.error('Error creating purchase:', purchaseError)
            throw purchaseError
          }

          console.log('Purchase created successfully:', purchase)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        // You could update a purchase record to 'failed' status here if needed
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Stripe requires the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

