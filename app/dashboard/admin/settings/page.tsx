'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/auth-context'
import { useAdmin } from '../../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'
import { createClient } from '../../../../lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">
          Admin <span className="font-medium italic">Settings</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure studio settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Studio Information</CardTitle>
          <CardDescription>
            Basic information about your Pilates studio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="studio-name">Studio Name</Label>
            <Input id="studio-name" defaultValue="Talasofilia Pilates" disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input id="contact-email" type="email" placeholder="studio@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class Settings</CardTitle>
          <CardDescription>
            Default settings for new classes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="default-capacity">Default Class Capacity</Label>
            <Input id="default-capacity" type="number" defaultValue="10" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="booking-window">Booking Window (hours before class)</Label>
            <Input id="booking-window" type="number" defaultValue="24" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cancellation-window">Cancellation Window (hours before class)</Label>
            <Input id="cancellation-window" type="number" defaultValue="12" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Booking Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when users book classes
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cancellation Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when users cancel bookings
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Capacity Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when classes are almost full
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          className="rounded-none" 
          disabled={loading}
          onClick={() => toast.info('Settings functionality coming soon!')}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}