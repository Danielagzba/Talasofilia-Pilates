'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../../../contexts/auth-context'
import { useAdmin } from '../../../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { createClient } from '../../../../../lib/supabase'
import { Loader2, ArrowLeft, User, Calendar, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

interface UserProfile {
  id: string
  display_name: string
  phone: string
  avatar_url: string
  created_at: string
  updated_at: string
  classHistory?: any[]
  purchases?: any[]
}

export default function UserProfilePage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  useEffect(() => {
    if (isAdmin && userId) {
      fetchUserProfile()
    }
  }, [isAdmin, userId])

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Fetch user's class history
      const { data: classHistory, error: historyError } = await supabase
        .from('class_bookings')
        .select(`
          *,
          class_schedules (
            class_name,
            instructor_name,
            class_date,
            start_time,
            end_time
          )
        `)
        .eq('user_id', userId)
        .order('booked_at', { ascending: false })

      if (historyError) throw historyError

      // Fetch user's purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('user_purchases')
        .select(`
          *,
          class_packages (
            name,
            number_of_classes,
            validity_days
          )
        `)
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false })

      if (purchasesError) throw purchasesError

      setUserProfile({
        ...profile,
        classHistory,
        purchases
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const getClassStats = () => {
    if (!userProfile?.classHistory) return { total: 0, attended: 0, cancelled: 0, upcoming: 0 }
    
    const stats = {
      total: userProfile.classHistory.length,
      attended: userProfile.classHistory.filter(b => b.booking_status === 'attended').length,
      cancelled: userProfile.classHistory.filter(b => b.booking_status === 'cancelled').length,
      upcoming: userProfile.classHistory.filter(b => {
        const classDate = new Date(`${b.class_schedules.class_date} ${b.class_schedules.start_time}`)
        return b.booking_status === 'confirmed' && classDate > new Date()
      }).length
    }
    
    return stats
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

  const stats = getClassStats()

  return (
    <div className="space-y-8">
      {/* Header with navigation */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/users">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* User Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-stone-200 flex items-center justify-center">
          {userProfile?.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              alt={userProfile.display_name} 
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-stone-600" />
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-light">
            {userProfile?.display_name || 'User Profile'}
          </h1>
          <p className="text-muted-foreground">
            Member since {userProfile && format(new Date(userProfile.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Classes</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attended</CardDescription>
            <CardTitle className="text-2xl">{stats.attended}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-2xl">{stats.upcoming}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled</CardDescription>
            <CardTitle className="text-2xl">{stats.cancelled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Display Name</p>
              <p className="font-medium">{userProfile?.display_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{userProfile?.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-medium text-xs">{userProfile?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Passes */}
      <Card>
        <CardHeader>
          <CardTitle>Class Passes</CardTitle>
          <CardDescription>
            All purchased class packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userProfile?.purchases && userProfile.purchases.length > 0 ? (
            <div className="space-y-3">
              {userProfile.purchases.map((purchase: any) => {
                const isActive = new Date(purchase.expiry_date) > new Date() && purchase.classes_remaining > 0
                const isExpired = new Date(purchase.expiry_date) <= new Date()
                
                return (
                  <div 
                    key={purchase.id} 
                    className={`p-4 rounded-lg border ${
                      isActive ? 'bg-green-50 border-green-200' : 
                      isExpired ? 'bg-red-50 border-red-200' : 
                      'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{purchase.class_packages?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Purchased {format(new Date(purchase.purchase_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm mt-1">
                          ${purchase.amount_paid} • {purchase.payment_method || 'Unknown method'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {purchase.classes_remaining}/{purchase.total_classes}
                        </p>
                        <p className="text-sm text-muted-foreground">classes remaining</p>
                        <p className="text-sm mt-1">
                          {isActive ? (
                            <span className="text-green-700">
                              Expires {format(new Date(purchase.expiry_date), 'MMM d, yyyy')}
                            </span>
                          ) : isExpired ? (
                            <span className="text-red-700 font-medium">Expired</span>
                          ) : (
                            <span className="text-stone-700">
                              Expires {format(new Date(purchase.expiry_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No class passes purchased</p>
          )}
        </CardContent>
      </Card>

      {/* Class History */}
      <Card>
        <CardHeader>
          <CardTitle>Class History</CardTitle>
          <CardDescription>
            All classes booked by this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userProfile?.classHistory && userProfile.classHistory.length > 0 ? (
            <div className="space-y-2">
              {userProfile.classHistory.map((booking: any) => {
                const classDate = new Date(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`)
                const isPast = classDate < new Date()
                
                return (
                  <div 
                    key={booking.id} 
                    className="flex justify-between items-center p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{booking.class_schedules?.class_name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.booking_status === 'confirmed' && !isPast ? 'bg-green-100 text-green-800' :
                          booking.booking_status === 'attended' ? 'bg-blue-100 text-blue-800' :
                          booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          booking.booking_status === 'no-show' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.booking_status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {format(new Date(booking.class_schedules?.class_date), 'EEEE, MMM d, yyyy')} at {booking.class_schedules?.start_time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Instructor: {booking.class_schedules?.instructor_name}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Booked {format(new Date(booking.booked_at), 'MMM d, yyyy')}</p>
                      {booking.cancelled_at && (
                        <p className="text-red-600">
                          Cancelled {format(new Date(booking.cancelled_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No class history</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}