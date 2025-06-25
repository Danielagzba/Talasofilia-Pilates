'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Calendar, Clock, Users, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ClassesPage() {
  const quickActions = [
    {
      title: 'Book a Class',
      description: 'Reserve your spot in upcoming Pilates classes',
      icon: Calendar,
      href: '/dashboard/book-class',
      variant: 'default' as const,
    },
    {
      title: 'My Classes',
      description: 'View and manage your booked classes',
      icon: Clock,
      href: '/dashboard/my-classes',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light">
          Class <span className="font-medium italic">Hub</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Everything you need to manage your Pilates classes
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