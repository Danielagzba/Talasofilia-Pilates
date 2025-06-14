import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { sendEmail, emailTemplates } from '@/lib/email-service'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    console.error('Stripe not configured. Please check your STRIPE_SECRET_KEY environment variable.')
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 503 }
    )
  }

  if (!webhookSecret) {
    console.error('Webhook secret not configured. Please check your STRIPE_WEBHOOK_SECRET environment variable.')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
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

  const supabase = createServiceSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Processing checkout.session.completed:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          metadata: session.metadata,
          amountTotal: session.amount_total
        })
        
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
            console.error('Purchase data attempted:', {
              user_id: metadata.userId,
              package_id: metadata.packageId,
              classes_remaining: parseInt(metadata.numberOfClasses),
              total_classes: parseInt(metadata.numberOfClasses),
              amount_paid: session.amount_total! / 100,
              expiry_date: expiryDate.toISOString(),
            })
            throw purchaseError
          }

          console.log('Purchase created successfully:', purchase)

          // Send purchase confirmation email
          try {
            // Get user details
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(metadata.userId)
            
            if (!userError && userData.user?.email) {
              // Get user profile
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('display_name')
                .eq('user_id', metadata.userId)
                .single()

              // Get package details
              const { data: packageData } = await supabase
                .from('class_packages')
                .select('name')
                .eq('id', metadata.packageId)
                .single()

              const userName = profile?.display_name || userData.user.email.split('@')[0] || 'there'
              const emailData = emailTemplates.purchaseConfirmation(
                userName,
                packageData?.name || 'Class Package',
                parseInt(metadata.numberOfClasses),
                parseInt(metadata.validityDays),
                session.amount_total!
              )

              await sendEmail({
                to: userData.user.email,
                ...emailData
              })
            }
          } catch (emailError) {
            console.error('Failed to send purchase confirmation email:', emailError)
            // Don't throw error here as the purchase was successful
          }
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

// Note: In Next.js App Router, we handle raw body differently
// The body is already read as text in the POST function
