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
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  
  // Form state
  const [settings, setSettings] = useState({
    studio_name: 'Talasofilia Pilates',
    contact_email: '',
    phone_number: '',
    default_class_capacity: 10,
    booking_window_hours: 3,
    cancellation_window_hours: 24,
    notification_new_booking: true,
    notification_cancellation: true,
    notification_low_capacity: true
  })

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        // Get auth headers
        const { getAuthHeaders } = await import('@/lib/auth-helpers')
        const authHeaders = await getAuthHeaders()
        
        // First check if settings table exists
        const checkResponse = await fetch('/api/admin/settings/check', {
          headers: authHeaders
        })
        const checkData = await checkResponse.json()
        
        if (!checkResponse.ok || !checkData.exists) {
          toast.error('Settings table not found. Please run the database migration.')
          console.error('Settings table check:', checkData)
          setLoading(false)
          return
        }
        
        const response = await fetch('/api/admin/settings', {
          headers: authHeaders
        })
        if (response.ok) {
          const data = await response.json()
          setSettings({
            studio_name: data.studio_name || 'Talasofilia Pilates',
            contact_email: data.contact_email || '',
            phone_number: data.phone_number || '',
            default_class_capacity: Number(data.default_class_capacity) || 10,
            booking_window_hours: Number(data.booking_window_hours) || 3,
            cancellation_window_hours: Number(data.cancellation_window_hours) || 24,
            notification_new_booking: data.notification_new_booking === 'true',
            notification_cancellation: data.notification_cancellation === 'true',
            notification_low_capacity: data.notification_low_capacity === 'true'
          })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    
    if (isAdmin) {
      loadSettings()
    }
  }, [isAdmin])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Get auth headers
      const { getAuthHeaders } = await import('@/lib/auth-helpers')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        const errorData = await response.json()
        console.error('Settings save error:', errorData)
        toast.error(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }
  
  if (adminLoading || loading) {
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
            <Input 
              id="studio-name" 
              value={settings.studio_name}
              onChange={(e) => setSettings({...settings, studio_name: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input 
              id="contact-email" 
              type="email" 
              placeholder="studio@example.com"
              value={settings.contact_email}
              onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+1 (555) 000-0000"
              value={settings.phone_number}
              onChange={(e) => setSettings({...settings, phone_number: e.target.value})}
            />
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
            <Input 
              id="default-capacity" 
              type="number" 
              value={settings.default_class_capacity}
              onChange={(e) => setSettings({...settings, default_class_capacity: parseInt(e.target.value) || 10})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="booking-window">Booking Window (hours before class)</Label>
            <Input 
              id="booking-window" 
              type="number" 
              value={settings.booking_window_hours}
              onChange={(e) => setSettings({...settings, booking_window_hours: parseInt(e.target.value) || 3})}
            />
            <p className="text-sm text-muted-foreground">Users can book up to 3 hours before class starts</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cancellation-window">Cancellation Window (hours before class)</Label>
            <Input 
              id="cancellation-window" 
              type="number" 
              value={settings.cancellation_window_hours}
              onChange={(e) => setSettings({...settings, cancellation_window_hours: parseInt(e.target.value) || 24})}
            />
            <p className="text-sm text-muted-foreground">Users can cancel up to 24 hours before class starts</p>
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
            <Switch 
              checked={settings.notification_new_booking}
              onCheckedChange={(checked) => setSettings({...settings, notification_new_booking: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cancellation Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when users cancel bookings
              </p>
            </div>
            <Switch 
              checked={settings.notification_cancellation}
              onCheckedChange={(checked) => setSettings({...settings, notification_cancellation: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Capacity Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when classes are almost full
              </p>
            </div>
            <Switch 
              checked={settings.notification_low_capacity}
              onCheckedChange={(checked) => setSettings({...settings, notification_low_capacity: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          className="rounded-none" 
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}