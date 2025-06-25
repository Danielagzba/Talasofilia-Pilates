'use client'

import Link from 'next/link'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Clock } from 'lucide-react'

export default function CheckoutPendingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Payment Pending</CardTitle>
          <CardDescription>
            Your payment is being processed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            We're waiting for confirmation from Mercado Pago. This usually takes just a few moments.
          </p>
          <p className="text-sm text-muted-foreground">
            You'll receive an email confirmation once your payment is approved and your classes are available.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full rounded-none">
            <Link href="/dashboard/purchase-history">Check Purchase History</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-none">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}