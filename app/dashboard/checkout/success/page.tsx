'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../../components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '../../../../lib/supabase'
import { useAuth } from '../../../../contexts/auth-context'

export default function CheckoutSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [purchase, setPurchase] = useState<any>(null)
  const searchParams = useSearchParams()
  
  // Handle both Stripe (session_id) and MercadoPago (payment_id) parameters
  const sessionId = searchParams.get('session_id')
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user && (sessionId || (paymentId && status === 'approved'))) {
      checkPurchase()
    }
  }, [user, sessionId, paymentId, status])

  const checkPurchase = async () => {
    try {
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get the most recent purchase for this user
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          class_packages (
            name,
            number_of_classes
          )
        `)
        .eq('user_id', user!.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setPurchase(data)
      }
    } catch (error) {
      console.error('Error checking purchase:', error)
    } finally {
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
          {purchase && (
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