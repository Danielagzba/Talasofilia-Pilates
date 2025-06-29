import { NextRequest, NextResponse } from 'next/server'
import { getPreference } from '@/lib/mercadopago'
import { createClient } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('MercadoPago checkout endpoint called')
  
  // Get MercadoPago preference instance
  const preference = getPreference()
  
  // Check if MercadoPago is configured
  if (!preference) {
    console.error('MercadoPago not configured. Please check your MERCADOPAGO_ACCESS_TOKEN environment variable.')
    console.error('MERCADOPAGO_ACCESS_TOKEN exists:', !!process.env.MERCADOPAGO_ACCESS_TOKEN)
    console.error('MERCADOPAGO_ACCESS_TOKEN value:', process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Set' : 'Not set')
    return NextResponse.json(
      { error: 'Payment system not configured. Please contact support.' },
      { status: 503 }
    )
  }

  try {
    const { packageId } = await request.json()
    console.log('Package ID:', packageId)

    // Get authorization header
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    // Get the actual origin from the request
    let origin = headersList.get('origin') || request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL
    
    // MercadoPago doesn't accept localhost URLs, use ngrok or production URL
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      console.warn('MercadoPago does not accept localhost URLs. Using production URL or you need to use ngrok.')
      origin = process.env.NEXT_PUBLIC_APP_URL || 'https://talasofiliapilates.com'
    }

    // Get the supabase client
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const supabase = createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = token 
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    
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

    // Create MercadoPago preference
    const preferenceData = {
      items: [
        {
          id: packageData.id,
          title: packageData.name,
          description: packageData.description || `${packageData.number_of_classes} Pilates classes - Valid for ${packageData.validity_days} days`,
          quantity: 1,
          unit_price: Number(packageData.price),
          currency_id: 'MXN'
        }
      ],
      payer: {
        email: user.email
      },
      back_urls: {
        success: `${origin}/dashboard/checkout/success`,
        failure: `${origin}/dashboard/buy-classes`,
        pending: `${origin}/dashboard/checkout/pending`
      },
      auto_return: 'approved',
      statement_descriptor: 'Talasofilia Pilates',
      external_reference: JSON.stringify({
        userId: user.id,
        packageId: packageData.id,
        packageName: packageData.name,
        numberOfClasses: packageData.number_of_classes,
        validityDays: packageData.validity_days,
      }),
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')}/api/mercadopago/webhook`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'atm' }
        ],
        installments: 1,
        default_installments: 1
      },
      binary_mode: true, // Instant approval or rejection
      marketplace: 'NONE'
    }

    console.log('Creating MercadoPago preference with data:', JSON.stringify(preferenceData, null, 2))
    
    let response
    try {
      response = await preference.create({ body: preferenceData })
      console.log('MercadoPago API call successful')
    } catch (mpError: any) {
      console.error('MercadoPago API error:', mpError)
      if (mpError.cause) {
        console.error('MercadoPago API cause:', mpError.cause)
      }
      if (mpError.status) {
        console.error('MercadoPago API status:', mpError.status)
      }
      throw mpError
    }

    console.log('MercadoPago response:', response)

    return NextResponse.json({ 
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    })
  } catch (error: any) {
    console.error('MercadoPago checkout error:', error)
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else if (typeof error === 'object' && error !== null) {
      console.error('Error object:', JSON.stringify(error, null, 2))
    } else {
      console.error('Error type:', typeof error)
      console.error('Error value:', error)
    }
    
    // If it's a MercadoPago API error, it might have more details
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('API Response:', (error as any).response)
    }
    
    // Extract meaningful error message
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'cause' in error) {
      errorMessage = JSON.stringify(error.cause)
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment preference', details: errorMessage },
      { status: 500 }
    )
  }
}