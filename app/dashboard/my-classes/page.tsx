'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Calendar, Clock, User, MapPin, X } from 'lucide-react'
import { toast } from 'sonner'
import moment from 'moment'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'

interface ClassBooking {
  id: string
  booking_status: string
  booked_at: string
  class_schedules: {
    id: string
    class_name: string
    instructor_name: string
    class_date: string
    start_time: string
    end_time: string
  }
}

export default function MyClassesPage() {
  const { user } = useAuth()
  const [upcomingClasses, setUpcomingClasses] = useState<ClassBooking[]>([])
  const [pastClasses, setPastClasses] = useState<ClassBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<ClassBooking | null>(null)
  const supabase = createClient()

  const fetchBookings = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          id,
          booking_status,
          booked_at,
          class_schedules (
            id,
            class_name,
            instructor_name,
            class_date,
            start_time,
            end_time
          )
        `)
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false })

      if (error) throw error

      if (data) {
        const now = moment()
        const upcoming: ClassBooking[] = []
        const past: ClassBooking[] = []

        data.forEach((booking: any) => {
          const classDateTime = moment(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`)
          
          if (classDateTime.isAfter(now) && booking.booking_status === 'confirmed') {
            upcoming.push(booking)
          } else {
            past.push(booking)
          }
        })

        // Sort upcoming by date
        upcoming.sort((a, b) => {
          const dateA = moment(`${a.class_schedules.class_date} ${a.class_schedules.start_time}`)
          const dateB = moment(`${b.class_schedules.class_date} ${b.class_schedules.start_time}`)
          return dateA.valueOf() - dateB.valueOf()
        })

        // Sort past by date (most recent first)
        past.sort((a, b) => {
          const dateA = moment(`${a.class_schedules.class_date} ${a.class_schedules.start_time}`)
          const dateB = moment(`${b.class_schedules.class_date} ${b.class_schedules.start_time}`)
          return dateB.valueOf() - dateA.valueOf()
        })

        setUpcomingClasses(upcoming)
        setPastClasses(past)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load your classes')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancelClick = (booking: ClassBooking) => {
    setSelectedBooking(booking)
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return

    setCancellingId(selectedBooking.id)
    try {
      // First get the booking details to find the purchase_id
      const { data: bookingData, error: bookingFetchError } = await supabase
        .from('class_bookings')
        .select('purchase_id')
        .eq('id', selectedBooking.id)
        .single()

      if (bookingFetchError) throw bookingFetchError

      // Update booking status to cancelled
      const { error: cancelError } = await supabase
        .from('class_bookings')
        .update({ 
          booking_status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id)

      if (cancelError) throw cancelError

      // Manually increment classes_remaining as fallback
      if (bookingData.purchase_id) {
        const { error: incrementError } = await supabase
          .rpc('increment_classes_remaining', { 
            purchase_id: bookingData.purchase_id 
          })

        // If RPC doesn't exist, try direct update
        if (incrementError) {
          const { data: purchaseData, error: purchaseFetchError } = await supabase
            .from('user_purchases')
            .select('classes_remaining')
            .eq('id', bookingData.purchase_id)
            .single()

          if (!purchaseFetchError && purchaseData) {
            const { error: directUpdateError } = await supabase
              .from('user_purchases')
              .update({ 
                classes_remaining: purchaseData.classes_remaining + 1 
              })
              .eq('id', bookingData.purchase_id)

            if (directUpdateError) {
              console.warn('Failed to manually increment classes:', directUpdateError)
            }
          }
        }
      }

      // Also manually decrement the class schedule booking count
      const { data: scheduleData, error: scheduleFetchError } = await supabase
        .from('class_schedules')
        .select('current_bookings')
        .eq('id', selectedBooking.class_schedules.id)
        .single()

      if (!scheduleFetchError && scheduleData) {
        const { error: scheduleUpdateError } = await supabase
          .from('class_schedules')
          .update({ 
            current_bookings: Math.max(0, scheduleData.current_bookings - 1)
          })
          .eq('id', selectedBooking.class_schedules.id)

        if (scheduleUpdateError) {
          console.warn('Failed to manually update class booking count:', scheduleUpdateError)
        }
      }

      toast.success('Class cancelled successfully')
      await fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel class')
    } finally {
      setCancellingId(null)
      setShowCancelDialog(false)
      setSelectedBooking(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'attended':
        return <Badge className="bg-blue-100 text-blue-800">Attended</Badge>
      case 'no-show':
        return <Badge className="bg-gray-100 text-gray-800">No Show</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading your classes...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-light mb-6">
        My <span className="font-medium italic">Classes</span>
      </h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-medium mb-4">Upcoming Classes</h2>
          {upcomingClasses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No upcoming classes booked yet.</p>
                <Button asChild className="mt-4 rounded-none">
                  <a href="/dashboard/book-class">Book a Class</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingClasses.map((booking) => {
                const classDate = moment(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`)
                const endTime = moment(`${booking.class_schedules.class_date} ${booking.class_schedules.end_time}`)
                const canCancel = classDate.diff(moment(), 'hours') >= 2

                return (
                  <Card key={booking.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{booking.class_schedules.class_name}</CardTitle>
                          <CardDescription>
                            Booked {moment(booking.booked_at).format('MMM D, YYYY')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(booking.booking_status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{classDate.format('dddd, MMMM D, YYYY')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{classDate.format('h:mm A')} - {endTime.format('h:mm A')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.class_schedules.instructor_name}</span>
                        </div>
                      </div>
                      
                      {canCancel && booking.booking_status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 rounded-none"
                          onClick={() => handleCancelClick(booking)}
                          disabled={cancellingId === booking.id}
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Class'}
                        </Button>
                      )}
                      
                      {!canCancel && booking.booking_status === 'confirmed' && (
                        <p className="text-xs text-muted-foreground mt-4">
                          Cancellation deadline has passed (2 hours before class)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-medium mb-4">Past Classes</h2>
          {pastClasses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No past classes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastClasses.map((booking) => {
                const classDate = moment(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`)
                const endTime = moment(`${booking.class_schedules.class_date} ${booking.class_schedules.end_time}`)

                return (
                  <Card key={booking.id} className="opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{booking.class_schedules.class_name}</CardTitle>
                          <CardDescription>
                            {classDate.format('MMMM D, YYYY')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(booking.booking_status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{classDate.format('h:mm A')} - {endTime.format('h:mm A')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.class_schedules.instructor_name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Class Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this class? Your credit will be returned to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Cancel Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}