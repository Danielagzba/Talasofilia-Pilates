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
  
  // Log if using test or production credentials
  const isTestMode = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-')
  console.log('MercadoPago Mode:', isTestMode ? 'TEST' : 'PRODUCTION')
  console.log('Public Key:', process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.substring(0, 20) + '...')

  try {
    const { packageId, deviceId, browserInfo } = await request.json()
    console.log('Package ID:', packageId)
    console.log('Device ID:', deviceId || 'Not provided')
    console.log('Browser Info:', browserInfo ? 'Provided' : 'Not provided')

    // Get headers
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    const deviceIdFromHeader = headersList.get('x-meli-session-id')
    
    // Get client IP address for fraud prevention
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0] || 
                    headersList.get('x-real-ip') || 
                    headersList.get('cf-connecting-ip') || // Cloudflare
                    'unknown'
    
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

    // Get user profile for additional information
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, phone_number')
      .eq('id', user.id)
      .single()

    // Create MercadoPago preference with enhanced buyer information
    const preferenceData = {
      items: [
        {
          id: packageData.id,
          title: packageData.name,
          description: packageData.description || `${packageData.number_of_classes} Pilates classes - Valid for ${packageData.validity_days} days`,
          quantity: 1,
          unit_price: Number(packageData.price),
          currency_id: 'MXN',
          category_id: 'services'
        }
      ],
      payer: {
        email: user.email,
        name: userProfile?.display_name || undefined,
        phone: userProfile?.phone_number ? {
          number: userProfile.phone_number
        } : undefined,
      },
      back_urls: {
        success: `${origin}/dashboard/checkout/success`,
        failure: `${origin}/dashboard/checkout/failure`,
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
      // Remove binary_mode to allow pending states and reduce false fraud positives
      marketplace: 'NONE',
      metadata: {
        integration_type: 'checkout_pro',
        platform: 'nextjs',
        site: 'talasofilia_pilates'
      }
    }

    // Add device session ID if provided (prefer from body, fallback to header)
    const finalDeviceId = deviceId || deviceIdFromHeader
    if (finalDeviceId) {
      console.log('Adding device fingerprint to preference:', finalDeviceId)
      // Add device_id to metadata instead of tracks
      preferenceData.metadata = {
        ...preferenceData.metadata,
        device_id: finalDeviceId
      }
    } else {
      console.warn('WARNING: No Device ID provided - this may trigger fraud detection!')
    }

    // Add additional_info for better fraud prevention
    const additionalInfo: any = {
      items: [
        {
          id: packageData.id,
          title: packageData.name,
          description: packageData.description || `${packageData.number_of_classes} Pilates classes`,
          category_id: 'services',
          quantity: 1,
          unit_price: Number(packageData.price)
        }
      ],
      payer: {
        first_name: userProfile?.display_name?.split(' ')[0] || '',
        last_name: userProfile?.display_name?.split(' ').slice(1).join(' ') || '',
        phone: {
          area_code: userProfile?.phone_number ? userProfile.phone_number.substring(0, 3) : '',
          number: userProfile?.phone_number ? userProfile.phone_number.substring(3) : ''
        },
        registration_date: user.created_at || new Date().toISOString()
      },
      ip_address: clientIp !== 'unknown' ? clientIp : undefined
    }
    
    // Add browser info to additional_info if provided
    if (browserInfo) {
      additionalInfo.device = {
        user_agent: browserInfo.userAgent,
        language: browserInfo.language,
        screen_resolution: browserInfo.screenResolution,
        timezone: browserInfo.timezone,
        platform: browserInfo.platform
      }
    }
    
    // Add additional_info to preference data
    ;(preferenceData as any).additional_info = additionalInfo

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
    
    // Log warning if test credentials are being used
    if (response.sandbox_init_point && !isTestMode) {
      console.warn('WARNING: Sandbox URL returned but not in test mode - check your credentials!')
    }
    if (!response.sandbox_init_point && isTestMode) {
      console.warn('WARNING: No sandbox URL returned but using TEST credentials!')
    }

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