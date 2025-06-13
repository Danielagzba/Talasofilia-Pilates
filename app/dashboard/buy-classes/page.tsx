'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '../../../lib/supabase'
import { getStripeJs } from '../../../lib/stripe'
import { useRouter } from 'next/navigation'

interface ClassPackage {
  id: string
  name: string
  description: string | null
  number_of_classes: number
  price: number
  validity_days: number
  is_active: boolean
}

export default function BuyClassesPage() {
  const [packages, setPackages] = useState<ClassPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('class_packages')
        .select('*')
        .eq('is_active', true)
        .order('number_of_classes', { ascending: true })

      if (error) throw error

      if (data) {
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to load class packages')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageId: string) => {
    setPurchasingId(packageId)
    
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({ packageId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { sessionId, url } = await response.json()

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        // Fallback to client-side redirect
        const stripe = await getStripeJs()
        if (!stripe) throw new Error('Stripe failed to load')

        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) throw error
      }
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
            <Card key={pkg.id} className={popular ? 'ring-2 ring-stone-900' : ''}>
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
              <CardContent>
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
              <CardFooter>
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