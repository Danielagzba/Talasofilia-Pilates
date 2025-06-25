'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../contexts/auth-context'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { User, Mail, Camera, ShoppingBag, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '../../lib/supabase'

interface UserPurchase {
  id: string
  classes_remaining: number
  total_classes: number
  expiry_date: string
  class_packages: {
    name: string
  }
}

interface UpcomingClass {
  id: string
  booking_date: string
  class_schedules: {
    class_name: string
    class_date: string
    start_time: string
    instructor_name: string
  }
}

export default function DashboardPage() {
  console.log('[Dashboard v2] Component rendering...') // Version 2 to force cache refresh
  const authContext = useAuth()
  const { user } = authContext
  console.log('[Dashboard v2] Auth context:', { user: user?.id, loading: authContext.loading })
  
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const subscriptionRef = useRef<any>(null)
  
  console.log('[Dashboard] Initial render - user:', user?.id, 'dataLoading:', dataLoading)
  
  // Failsafe to prevent infinite loading
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      if (dataLoading) {
        console.error('[Dashboard] Failsafe timeout triggered - forcing dataLoading to false')
        setDataLoading(false)
      }
    }, 15000) // 15 seconds max
    
    return () => clearTimeout(failsafeTimeout)
  }, [])

  useEffect(() => {
    if (user?.user_metadata) {
      setDisplayName(user.user_metadata.display_name || '')
      setPhotoURL(user.user_metadata.avatar_url || '')
    }
  }, [user])

  useEffect(() => {
    console.log('[Dashboard] User effect triggered, user:', user?.id, 'auth loading:', authContext.loading)
    
    // If auth is still loading, wait for it
    if (authContext.loading) {
      console.log('[Dashboard] Auth is still loading, waiting...')
      return
    }
    
    if (user) {
      fetchUserData()
    } else {
      // No user, make sure loading is false
      console.log('[Dashboard] No user and auth not loading, setting dataLoading to false')
      setDataLoading(false)
    }
  }, [user, authContext.loading])

  // Refresh data when page gains focus or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchUserData()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchUserData()
      }
    }

    // Add event listeners
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also refresh when navigating back to this page
    const handlePopState = () => {
      if (user) {
        fetchUserData()
      }
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [user])

  // Set up real-time subscription for user purchases
  useEffect(() => {
    if (!user) return

    console.log('[Dashboard] Setting up real-time subscription...')
    // Create a fresh Supabase client for subscriptions
    let subscriptionClient
    try {
      subscriptionClient = createClient()
      console.log('[Dashboard] Subscription client created')
    } catch (error) {
      console.error('[Dashboard] Error creating subscription client:', error)
      return
    }
    
    // Subscribe to changes in user_purchases table
    const channel = subscriptionClient
      .channel('user_purchases_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_purchases',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User purchases changed:', payload)
          fetchUserData()
        }
      )
      .subscribe((status) => {
        console.log('[Dashboard] Subscription status:', status)
      })

    subscriptionRef.current = channel

    return () => {
      console.log('[Dashboard] Unsubscribing from real-time updates')
      channel.unsubscribe()
    }
  }, [user?.id])

  const fetchUserData = async () => {
    const startTime = Date.now()
    console.log(`[Dashboard ${startTime}] fetchUserData called, user:`, user?.id)
    if (!user) {
      console.log(`[Dashboard ${startTime}] No user, skipping fetch`)
      setDataLoading(false)
      return
    }
    
    // Set a timeout to ensure we don't hang forever
    const timeoutId = setTimeout(() => {
      console.error(`[Dashboard ${startTime}] Fetch timeout after ${Date.now() - startTime}ms - setting loading to false`)
      setDataLoading(false)
    }, 10000) // 10 second timeout
    
    try {
      console.log(`[Dashboard ${startTime}] Fetching from API route... (${Date.now() - startTime}ms)`)
      
      const response = await fetch('/api/dashboard/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`[Dashboard ${startTime}] API response received (${Date.now() - startTime}ms), status:`, response.status)
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`[Dashboard ${startTime}] API data parsed (${Date.now() - startTime}ms)`)
      
      console.log('[Dashboard] User purchases:', data.purchases)
      setUserPurchases(data.purchases || [])
      
      console.log('[Dashboard] Upcoming classes:', data.upcomingClasses?.length || 0)
      setUpcomingClasses(data.upcomingClasses || [])
      
    } catch (error) {
      console.error(`[Dashboard ${startTime}] Error fetching user data:`, error)
      setUserPurchases([])
      setUpcomingClasses([])
    } finally {
      clearTimeout(timeoutId)
      console.log(`[Dashboard ${startTime}] Setting dataLoading to false (${Date.now() - startTime}ms)`)
      setDataLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Delete old avatar if exists
      if (user.user_metadata?.avatar_url) {
        const oldPath = user.user_metadata.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setPhotoURL(publicUrl)
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      toast.success('Profile photo updated!')
    } catch (error) {
      toast.error('Failed to upload photo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      if (error) throw error

      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user?.email?.[0].toUpperCase() || 'U'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">
          My <span className="font-medium italic">Dashboard</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and Pilates journey
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile photo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={photoURL || user?.user_metadata?.avatar_url} 
                  alt="Profile photo"
                />
                <AvatarFallback className="text-lg bg-stone-100">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-md cursor-pointer hover:bg-stone-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={loading}
                />
              </label>
            </div>
            <div>
              <h3 className="font-medium text-lg">
                {displayName || user?.user_metadata?.display_name || 'Welcome!'}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={loading || !displayName}
              className="rounded-none"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Class Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {userPurchases.reduce((sum, p) => sum + p.classes_remaining, 0)} Classes
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {userPurchases.length === 0
                    ? 'No active class packages'
                    : `${userPurchases.length} active ${userPurchases.length === 1 ? 'package' : 'packages'}`}
                </p>
                {userPurchases.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {userPurchases.map(purchase => (
                      <p key={purchase.id} className="text-xs text-muted-foreground">
                        {purchase.class_packages.name}: {purchase.classes_remaining} of {purchase.total_classes} remaining
                      </p>
                    ))}
                  </div>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 rounded-none w-full"
                >
                  <Link href={userPurchases.length > 0 ? "/dashboard/book-class" : "/dashboard/buy-classes"}>
                    {userPurchases.length > 0 ? "Book a Class" : "Buy Classes"}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">{upcomingClasses.length} Classes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {upcomingClasses.length === 0
                    ? 'No upcoming bookings'
                    : upcomingClasses.length === 1
                    ? 'Next class scheduled'
                    : 'Classes scheduled'}
                </p>
                {upcomingClasses.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {upcomingClasses.slice(0, 2).map(booking => (
                      <p key={booking.id} className="text-xs text-muted-foreground">
                        {new Date(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })} - {booking.class_schedules.class_name}
                      </p>
                    ))}
                    {upcomingClasses.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{upcomingClasses.length - 2} more
                      </p>
                    )}
                  </div>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 rounded-none w-full"
                >
                  <Link href={upcomingClasses.length > 0 ? "/dashboard/my-classes" : "/dashboard/book-class"}>
                    {upcomingClasses.length > 0 ? "View All Classes" : "Book a Class"}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}