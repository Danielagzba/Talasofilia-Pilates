'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../../components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../../../contexts/auth-context'
import { getAuthHeaders } from '@/lib/auth-helpers'

export default function CheckoutSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [purchase, setPurchase] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)
  const searchParams = useSearchParams()
  
  // Handle both Stripe (session_id) and MercadoPago (payment_id) parameters
  const sessionId = searchParams.get('session_id')
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  
  const { user } = useAuth()

  useEffect(() => {
    if (user && (sessionId || (paymentId && status === 'approved'))) {
      checkPurchase()
    }
  }, [user, sessionId, paymentId, status])

  const checkPurchase = async (currentRetryCount = retryCount) => {
    try {
      console.log('[CheckoutSuccess] Starting purchase check, attempt:', currentRetryCount + 1)
      
      // Wait a moment for webhook to process (longer on retries)
      const waitTime = currentRetryCount === 0 ? 2000 : 3000
      await new Promise(resolve => setTimeout(resolve, waitTime))

      // Get auth headers
      const authHeaders = await getAuthHeaders()
      
      // Fetch purchase data from API route
      const response = await fetch('/api/checkout/verify-purchase', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
      })
      
      console.log('[CheckoutSuccess] API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[CheckoutSuccess] Purchase data:', data.purchase?.id)
        if (data.purchase) {
          setPurchase(data.purchase)
          setLoading(false)
        } else if (currentRetryCount < 3) {
          // No purchase found yet, retry up to 3 times
          console.log('[CheckoutSuccess] No purchase found, retrying...')
          const newRetryCount = currentRetryCount + 1
          setRetryCount(newRetryCount)
          setTimeout(() => checkPurchase(newRetryCount), 2000)
        } else {
          // Max retries reached
          console.error('[CheckoutSuccess] Purchase not found after retries')
          setLoading(false)
        }
      } else {
        console.error('[CheckoutSuccess] Failed to fetch purchase')
        setLoading(false)
      }
    } catch (error) {
      console.error('[CheckoutSuccess] Error checking purchase:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {purchase ? (
            <div className="space-y-4">
              <div className="bg-stone-100 p-4 rounded">
                <p className="font-medium text-lg">{purchase.class_packages.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {purchase.class_packages.number_of_classes} classes available
                </p>
                <p className="text-sm text-muted-foreground">
                  Valid until {new Date(purchase.expiry_date).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to {user?.email}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your payment was successful! Your purchase details will be available shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see your purchase within a few minutes, please refresh this page or contact support.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full rounded-none">
            <Link href="/dashboard/book-class">Book Your First Class</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-none">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}