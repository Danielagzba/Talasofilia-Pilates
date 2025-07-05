'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth-helpers'

interface ClassPackage {
  id: string
  name: string
  description: string | null
  number_of_classes: number
  price: number
  validity_days: number
  is_active: boolean
}

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string
  }
}

export default function BuyClassesPage() {
  const [packages, setPackages] = useState<ClassPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      console.log('[BuyClasses] Fetching packages...')
      
      const response = await fetch('/api/packages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }
      
      const { packages } = await response.json()
      console.log('[BuyClasses] Received packages:', packages.length)
      setPackages(packages)
    } catch (error) {
      console.error('[BuyClasses] Error fetching packages:', error)
      toast.error('Failed to load class packages')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageId: string) => {
    setPurchasingId(packageId)
    
    try {
      console.log('[BuyClasses] Starting checkout for package:', packageId)
      
      // Get auth headers
      const authHeaders = await getAuthHeaders()
      
      // Get MercadoPago Device ID
      const deviceId = window.MP_DEVICE_SESSION_ID
      if (deviceId) {
        console.log('[BuyClasses] MercadoPago Device ID found:', deviceId)
      } else {
        console.log('[BuyClasses] Warning: MercadoPago Device ID not found')
      }
      
      // Collect browser information for better fraud detection
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform
      }
      
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(deviceId ? { 'X-meli-session-id': deviceId } : {})
        },
        body: JSON.stringify({ packageId, deviceId, browserInfo }),
        credentials: 'include' // Include cookies for authentication
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Checkout API error:', error)
        throw new Error(error.details || error.error || 'Failed to create payment preference')
      }

      const { initPoint, sandboxInitPoint } = await response.json()
      
      console.log('MercadoPago URLs returned:', {
        initPoint: initPoint ? 'Present' : 'Missing',
        sandboxInitPoint: sandboxInitPoint ? 'Present' : 'Missing'
      })

      // Redirect to MercadoPago Checkout
      // Determine which URL to use based on what MercadoPago returns
      let checkoutUrl = initPoint
      let isTestMode = false
      
      // If only sandboxInitPoint is returned, we must be in test mode
      if (sandboxInitPoint && !initPoint) {
        checkoutUrl = sandboxInitPoint
        isTestMode = true
      }
      // If both are returned, check environment
      else if (sandboxInitPoint && initPoint) {
        const isProduction = process.env.NODE_ENV === 'production'
        if (isProduction) {
          // In production, prefer initPoint but log if sandbox is present
          checkoutUrl = initPoint
          console.warn('Both production and sandbox URLs returned in production environment')
        } else {
          // In development, use sandbox if available
          checkoutUrl = sandboxInitPoint
          isTestMode = true
        }
      }
      
      // Show appropriate messages
      if (isTestMode) {
        toast.info('Opening Mercado Pago in test mode. Use a test user account to complete the purchase.')
      }
      
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to start checkout process')
      setPurchasingId(null)
    }
  }

  const getFeatures = (pkg: ClassPackage): string[] => {
    const features = [
      `${pkg.number_of_classes} Pilates ${pkg.number_of_classes === 1 ? 'session' : 'sessions'}`,
      `Valid for ${pkg.validity_days} days`,
    ]

    if (pkg.number_of_classes >= 4) {
      const pricePerClass = pkg.price / pkg.number_of_classes
      const savings = 350 - pricePerClass
      features.push(`Save ${Math.round(savings)} MXN per class`)
    }

    if (pkg.number_of_classes >= 4) {
      features.push('Flexible scheduling')
    }

    if (pkg.number_of_classes >= 8) {
      features.push('Priority booking')
    }

    if (pkg.number_of_classes >= 12) {
      features.push('Free guest pass')
    }

    return features
  }

  const isPopular = (pkg: ClassPackage) => {
    return pkg.number_of_classes === 4
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return (
    <div>
      <h1 className="font-serif text-3xl font-light mb-6">
        Buy <span className="font-medium italic">Classes</span>
      </h1>
      <p className="text-muted-foreground mb-8">
        Choose a class package that suits your practice
      </p>
      
      <div className="grid md:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const features = getFeatures(pkg)
          const popular = isPopular(pkg)
          
          return (
            <Card key={pkg.id} className={`flex flex-col h-full ${popular ? 'ring-2 ring-stone-900' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{pkg.name}</CardTitle>
                    <CardDescription>Valid for {pkg.validity_days} days</CardDescription>
                  </div>
                  {popular && (
                    <span className="text-xs bg-stone-900 text-white px-2 py-1">
                      POPULAR
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                  <span className="text-muted-foreground"> MXN</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pkg.number_of_classes} {pkg.number_of_classes === 1 ? 'class' : 'classes'}
                  </p>
                </div>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-stone-600 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button 
                  className="w-full rounded-none"
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasingId === pkg.id}
                >
                  {purchasingId === pkg.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Purchase ${pkg.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}