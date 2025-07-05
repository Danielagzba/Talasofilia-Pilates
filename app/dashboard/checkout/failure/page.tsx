'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { XCircle, AlertCircle, CreditCard, Shield, RefreshCcw, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams()
  const statusDetail = searchParams.get('status_detail')
  
  // Common payment failure reasons from MercadoPago
  const getFailureReason = (detail: string | null) => {
    const reasons: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
      'cc_rejected_insufficient_amount': {
        title: 'Insufficient Funds',
        description: 'Your card has insufficient funds. Please try another payment method or contact your bank.',
        icon: <CreditCard className="h-5 w-5" />
      },
      'cc_rejected_bad_filled_security_code': {
        title: 'Invalid Security Code',
        description: 'The security code (CVV) entered is incorrect. Please check your card and try again.',
        icon: <Shield className="h-5 w-5" />
      },
      'cc_rejected_bad_filled_card_number': {
        title: 'Invalid Card Number',
        description: 'The card number entered is incorrect. Please verify and try again.',
        icon: <CreditCard className="h-5 w-5" />
      },
      'cc_rejected_high_risk': {
        title: 'Payment Declined for Security Reasons',
        description: 'Your payment was declined for security reasons. Please try a different payment method or contact your bank.',
        icon: <Shield className="h-5 w-5" />
      },
      'cc_rejected_max_attempts': {
        title: 'Too Many Attempts',
        description: 'You have exceeded the maximum number of attempts. Please wait a moment before trying again.',
        icon: <RefreshCcw className="h-5 w-5" />
      },
      'cc_rejected_call_for_authorize': {
        title: 'Authorization Required',
        description: 'Your bank requires authorization for this payment. Please contact your bank to authorize the transaction.',
        icon: <CreditCard className="h-5 w-5" />
      },
      'default': {
        title: 'Payment Declined',
        description: 'Your payment could not be processed. Please try again or use a different payment method.',
        icon: <XCircle className="h-5 w-5" />
      }
    }
    
    return reasons[detail || ''] || reasons.default
  }
  
  const failureInfo = getFailureReason(statusDetail)

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>
            We couldn't process your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <div className="flex items-start space-x-2">
              {failureInfo.icon}
              <div className="flex-1">
                <AlertTitle>{failureInfo.title}</AlertTitle>
                <AlertDescription className="mt-2">
                  {failureInfo.description}
                </AlertDescription>
              </div>
            </div>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What can you do?</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <RefreshCcw className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Try Again</p>
                  <p className="text-sm text-muted-foreground">
                    Return to the packages page and try your purchase again with the same or a different card.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Use a Different Payment Method</p>
                  <p className="text-sm text-muted-foreground">
                    Try using a different credit or debit card, or contact your bank to ensure your card is authorized for online purchases.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Check Your Information</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure your card details, billing address, and security code are entered correctly.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Contact Support</p>
                  <p className="text-sm text-muted-foreground">
                    If you continue experiencing issues, please contact us for assistance with your purchase.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href="/dashboard/buy-classes">
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link 
              href="/dashboard" 
              className="text-sm text-muted-foreground hover:underline"
            >
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}