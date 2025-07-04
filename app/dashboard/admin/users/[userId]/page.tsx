'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../../../contexts/auth-context'
import { useAdmin } from '../../../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Loader2, ArrowLeft, User, Calendar, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'
import { AddCreditsModal } from '../../../../../components/admin/add-credits-modal'
import { getAuthHeaders } from '@/lib/auth-helpers'

interface UserProfile {
  id: string
  display_name: string
  phone: string
  avatar_url: string
  created_at: string
  updated_at: string
}

interface UserData {
  profile: UserProfile
  classHistory: any[]
  purchases: any[]
}

export default function UserProfilePage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false)

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
      const authHeaders = await getAuthHeaders()
      const response = await fetch(`/api/admin/users/${userId}/profile`, {
        headers: authHeaders
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const getClassStats = () => {
    if (!userData?.classHistory) return { total: 0, attended: 0, cancelled: 0, upcoming: 0 }
    
    const stats = {
      total: userData.classHistory.length,
      attended: userData.classHistory.filter(b => b.booking_status === 'attended').length,
      cancelled: userData.classHistory.filter(b => b.booking_status === 'cancelled').length,
      upcoming: userData.classHistory.filter(b => {
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
          {userData?.profile.avatar_url ? (
            <img 
              src={userData.profile.avatar_url} 
              alt={userData.profile.display_name} 
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-stone-600" />
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-light">
            {userData?.profile.display_name || 'User Profile'}
          </h1>
          <p className="text-muted-foreground">
            Member since {userData && format(new Date(userData.profile.created_at), 'MMMM d, yyyy')}
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
              <p className="font-medium">{userData?.profile.display_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{userData?.profile.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-medium text-xs">{userData?.profile.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Passes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <CardTitle>Class Passes</CardTitle>
              <CardDescription>
                All purchased class packages
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddCreditsModal(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Credits
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userData?.purchases && userData.purchases.length > 0 ? (
            <div className="space-y-3">
              {userData.purchases.map((purchase: any) => {
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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{purchase.class_packages?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Purchased {format(new Date(purchase.purchase_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm mt-1">
                          ${purchase.amount_paid} • {purchase.payment_method || 'Unknown method'}
                        </p>
                      </div>
                      <div className="sm:text-right">
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
          {userData?.classHistory && userData.classHistory.length > 0 ? (
            <div className="space-y-2">
              {userData.classHistory.map((booking: any) => {
                const classDate = new Date(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`)
                const isPast = classDate < new Date()
                
                return (
                  <div 
                    key={booking.id} 
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{booking.class_schedules?.class_name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
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
                    <div className="sm:text-right text-sm text-muted-foreground">
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

      {/* Add Credits Modal */}
      {showAddCreditsModal && userData && (
        <AddCreditsModal
          userId={userId}
          userName={userData.profile.display_name}
          onClose={() => setShowAddCreditsModal(false)}
          onSuccess={() => {
            setShowAddCreditsModal(false)
            fetchUserProfile() // Refresh the data
          }}
        />
      )}
    </div>
  )
}