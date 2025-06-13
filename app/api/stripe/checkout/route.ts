import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    console.error('Stripe not configured. Please check your STRIPE_SECRET_KEY environment variable.')
    return NextResponse.json(
      { error: 'Payment system not configured. Please contact support.' },
      { status: 503 }
    )
  }

  try {
    const { packageId } = await request.json()

    // Get authorization header
    const headersList = await headers()
    const authorization = headersList.get('authorization')

    // Get the supabase client
    const supabase = createClient()

    // Get the authenticated user using the token from the header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authorization?.replace('Bearer ', '') || undefined
    )
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the package details
    const { data: packageData, error: packageError } = await supabase
      .from('class_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: packageData.name,
              description: packageData.description || `${packageData.number_of_classes} Pilates classes - Valid for ${packageData.validity_days} days`,
            },
            unit_amount: Math.round(packageData.price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard/buy-classes`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        packageId: packageData.id,
        packageName: packageData.name,
        numberOfClasses: packageData.number_of_classes.toString(),
        validityDays: packageData.validity_days.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}