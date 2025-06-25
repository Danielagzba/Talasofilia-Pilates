'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { ShoppingBag, History, CreditCard, Package } from 'lucide-react'
import Link from 'next/link'

export default function PurchasesPage() {
  const quickActions = [
    {
      title: 'Buy Classes',
      description: 'Purchase class packages and credits',
      icon: ShoppingBag,
      href: '/dashboard/buy-classes',
      variant: 'default' as const,
    },
    {
      title: 'Purchase History',
      description: 'View your past transactions and receipts',
      icon: History,
      href: '/dashboard/purchase-history',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light">
          Purchase <span className="font-medium italic">Center</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your class packages and view transaction history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant={action.variant} className="w-full rounded-none">
                  <Link href={action.href}>
                    {action.title}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}