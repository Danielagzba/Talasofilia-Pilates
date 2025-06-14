'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import moment from 'moment'
import { createClient } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/auth-context'
import { Button } from '../../../components/ui/button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Badge } from '../../../components/ui/badge'
import { Calendar as CalendarIcon, Clock, Users, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface ClassSchedule {
  id: string
  class_name: string
  instructor_name: string
  class_date: string
  start_time: string
  end_time: string
  max_capacity: number
  current_bookings: number
}

interface UserPurchase {
  id: string
  classes_remaining: number
  total_classes: number
  expiry_date: string
}

export default function BookClassPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([])
  const [userBookings, setUserBookings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(moment().startOf('week'))
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month')
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'))
  const [currentDay, setCurrentDay] = useState(moment())
  const supabase = createClient()
  const subscriptionRef = useRef<any>(null)

  // Fetch user's purchases
  const fetchUserPurchases = useCallback(async () => {
    if (!user) return

    console.log('Fetching user purchases...')
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .gte('expiry_date', new Date().toISOString())
      .gte('classes_remaining', 0) // Changed from gt to gte to include 0
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('Error fetching purchases:', error)
    } else if (data) {
      console.log('Fetched purchases:', data)
      setUserPurchases(data)
    }
  }, [user, supabase])

  // Fetch user's existing bookings
  const fetchUserBookings = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('class_bookings')
      .select('schedule_id')
      .eq('user_id', user.id)
      .eq('booking_status', 'confirmed')

    if (!error && data) {
      setUserBookings(data.map(booking => booking.schedule_id))
    }
  }, [user, supabase])

  // Fetch class schedules for current view
  const fetchClassSchedules = useCallback(async () => {
    let startDate, endDate
    
    if (viewMode === 'day') {
      startDate = currentDay.clone().startOf('day')
      endDate = currentDay.clone().endOf('day')
    } else if (viewMode === 'week') {
      startDate = currentWeek.clone().startOf('week')
      endDate = currentWeek.clone().endOf('week')
    } else {
      startDate = currentMonth.clone().startOf('month').startOf('week')
      endDate = currentMonth.clone().endOf('month').endOf('week')
    }

    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .gte('class_date', startDate.format('YYYY-MM-DD'))
      .lte('class_date', endDate.format('YYYY-MM-DD'))
      .eq('is_cancelled', false)
      .order('class_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) {
      setSchedules(data)
    }
  }, [supabase, currentWeek, currentMonth, currentDay, viewMode])

  useEffect(() => {
    fetchUserPurchases()
    fetchUserBookings()
  }, [fetchUserPurchases, fetchUserBookings])

  useEffect(() => {
    fetchClassSchedules()
  }, [fetchClassSchedules])

  // Refresh data when page gains focus or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      fetchUserPurchases()
      fetchUserBookings()
      fetchClassSchedules()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserPurchases()
        fetchUserBookings()
        fetchClassSchedules()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchUserPurchases, fetchUserBookings, fetchClassSchedules])

  // Set up real-time subscription for user purchases
  useEffect(() => {
    if (!user) return

    // Subscribe to changes in user_purchases table
    subscriptionRef.current = supabase
      .channel('book_class_purchases_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_purchases',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User purchases changed in book-class:', payload)
          fetchUserPurchases()
        }
      )
      .subscribe()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [user, supabase, fetchUserPurchases])

  const handleSelectSchedule = (schedule: ClassSchedule) => {
    setSelectedSchedule(schedule)
    setIsBookingModalOpen(true)
  }

  const handleBookClass = async () => {
    if (!selectedSchedule || !user) return

    console.log('Starting booking process...')
    console.log('User purchases:', userPurchases)
    
    const availablePurchase = userPurchases.find(p => p.classes_remaining > 0)
    if (!availablePurchase) {
      toast.error('No available classes. Please purchase a class package.')
      return
    }

    console.log('Selected purchase:', availablePurchase)
    console.log('Classes remaining before booking:', availablePurchase.classes_remaining)

    setLoading(true)
    try {
      // Start a transaction by using RPC or multiple coordinated updates
      // First, create the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('class_bookings')
        .insert({
          user_id: user.id,
          schedule_id: selectedSchedule.id,
          purchase_id: availablePurchase.id,
          booking_status: 'confirmed'
        })
        .select()
        .single()

      if (bookingError) throw bookingError
      console.log('Booking created:', bookingData)

      // Manually decrement classes_remaining
      const newClassesRemaining = availablePurchase.classes_remaining - 1
      const { data: purchaseUpdate, error: purchaseError } = await supabase
        .from('user_purchases')
        .update({ 
          classes_remaining: newClassesRemaining 
        })
        .eq('id', availablePurchase.id)
        .eq('user_id', user.id) // Ensure user owns this purchase
        .select()
        .single()

      if (purchaseError) {
        console.error('Failed to decrement classes:', purchaseError)
        console.error('Purchase update details:', {
          purchaseId: availablePurchase.id,
          userId: user.id,
          newClassesRemaining,
          error: purchaseError
        })
        // Try to rollback by deleting the booking
        const { error: rollbackError } = await supabase
          .from('class_bookings')
          .delete()
          .eq('id', bookingData.id)
        
        if (rollbackError) {
          console.error('Failed to rollback booking:', rollbackError)
        }
        
        throw new Error(`Failed to update classes: ${purchaseError.message}`)
      }
      
      console.log('Classes decremented successfully:', purchaseUpdate)

      // Update the class schedule booking count
      const newBookingCount = (selectedSchedule.current_bookings || 0) + 1
      const { data: scheduleUpdate, error: scheduleError } = await supabase
        .from('class_schedules')
        .update({ 
          current_bookings: newBookingCount 
        })
        .eq('id', selectedSchedule.id)
        .select()
        .single()

      if (scheduleError) {
        console.error('Failed to update schedule booking count:', scheduleError)
        // Don't fail the whole transaction for this
      } else {
        console.log('Schedule updated successfully:', scheduleUpdate)
      }

      // Update local state immediately for better UX
      setUserPurchases(prev => prev.map(p => 
        p.id === availablePurchase.id 
          ? { ...p, classes_remaining: newClassesRemaining }
          : p
      ))

      setSchedules(prev => prev.map(s => 
        s.id === selectedSchedule.id 
          ? { ...s, current_bookings: newBookingCount }
          : s
      ))

      toast.success('Class booked successfully!')
      setIsBookingModalOpen(false)
      
      // Refresh all data to ensure consistency
      console.log('Refreshing data...')
      await Promise.all([
        fetchUserBookings(),
        fetchUserPurchases(),
        fetchClassSchedules()
      ])
      
      // Force router refresh to update all components
      router.refresh()
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to book class. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalClassesAvailable = userPurchases.reduce((sum, p) => sum + p.classes_remaining, 0)

  const groupSchedulesByDate = () => {
    const grouped: { [key: string]: ClassSchedule[] } = {}
    
    schedules.forEach(schedule => {
      const date = schedule.class_date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(schedule)
    })
    
    return grouped
  }

  const groupedSchedules = groupSchedulesByDate()
  
  const getDaysToDisplay = () => {
    if (viewMode === 'day') {
      return [currentDay]
    } else if (viewMode === 'week') {
      const days = []
      for (let i = 0; i < 7; i++) {
        days.push(currentWeek.clone().add(i, 'days'))
      }
      return days
    } else {
      const days = []
      const startOfMonth = currentMonth.clone().startOf('month')
      const startDate = startOfMonth.clone().startOf('week')
      const endOfMonth = currentMonth.clone().endOf('month')
      const endDate = endOfMonth.clone().endOf('week')
      
      let current = startDate.clone()
      while (current.isSameOrBefore(endDate)) {
        days.push(current.clone())
        current.add(1, 'day')
      }
      return days
    }
  }
  
  const daysToDisplay = getDaysToDisplay()

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-serif text-3xl font-light">
            Book a <span className="font-medium italic">Class</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Select a class to book your spot
          </p>
        </div>
        
        <Card className="w-64">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Available Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClassesAvailable}</p>
            {userPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                No active packages
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {userPurchases.length} active {userPurchases.length === 1 ? 'package' : 'packages'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (viewMode === 'day') {
                setCurrentDay(currentDay.clone().subtract(1, 'day'))
              } else if (viewMode === 'week') {
                setCurrentWeek(currentWeek.clone().subtract(1, 'week'))
              } else {
                setCurrentMonth(currentMonth.clone().subtract(1, 'month'))
              }
            }}
            className="rounded-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">
              {viewMode === 'day'
                ? currentDay.format('dddd, MMMM D, YYYY')
                : viewMode === 'week' 
                ? `${currentWeek.format('MMM D')} - ${currentWeek.clone().endOf('week').format('D, YYYY')}`
                : currentMonth.format('MMMM YYYY')}
            </h2>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
                className="rounded-none text-xs"
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="rounded-none text-xs"
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="rounded-none text-xs"
              >
                Month
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (viewMode === 'day') {
                setCurrentDay(currentDay.clone().add(1, 'day'))
              } else if (viewMode === 'week') {
                setCurrentWeek(currentWeek.clone().add(1, 'week'))
              } else {
                setCurrentMonth(currentMonth.clone().add(1, 'month'))
              }
            }}
            className="rounded-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === 'day' ? (
          // Day View - List format
          <div className="p-4">
            {schedules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No classes scheduled for this day</p>
            ) : (
              <div className="space-y-4">
                {schedules.map(schedule => {
                  const isBooked = userBookings.includes(schedule.id)
                  const currentBookings = Math.max(0, schedule.current_bookings) // Ensure never negative
                  const isFull = currentBookings >= schedule.max_capacity
                  const spotsAvailable = Math.max(0, schedule.max_capacity - currentBookings)
                  const classTime = moment(`${schedule.class_date} ${schedule.start_time}`)
                  const isPastClass = classTime.isBefore(moment())
                  
                  return (
                    <Card 
                      key={schedule.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${isPastClass ? 'opacity-50' : ''}`}
                      onClick={() => !isPastClass && !isBooked && !isFull && handleSelectSchedule(schedule)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-medium">
                                {moment(schedule.start_time, 'HH:mm:ss').format('h:mm A')}
                              </p>
                              <h3 className="text-xl font-medium">{schedule.class_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                with {schedule.instructor_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {isBooked ? (
                              <Badge className="bg-green-100 text-green-800">Booked</Badge>
                            ) : isFull ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">Full</Badge>
                            ) : isPastClass ? (
                              <Badge variant="secondary">Past</Badge>
                            ) : (
                              <div>
                                <p className="text-lg font-medium">{spotsAvailable} spots left</p>
                                <p className="text-sm text-muted-foreground">of {schedule.max_capacity}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          // Week/Month View - Grid format
          <>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={day + index} className="bg-white p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-7 gap-px bg-gray-200 ${viewMode === 'month' ? '' : ''}`}>
              {daysToDisplay.map(day => {
            const dateStr = day.format('YYYY-MM-DD')
            const daySchedules = groupedSchedules[dateStr] || []
            const isToday = day.isSame(moment(), 'day')
            const isPast = day.isBefore(moment(), 'day')
            const isCurrentMonth = viewMode === 'month' ? day.month() === currentMonth.month() : true
            const dayOfWeek = day.day()
            
            return (
              <div 
                key={dateStr} 
                className={`bg-white p-2 ${viewMode === 'month' ? 'min-h-[100px]' : 'min-h-[120px]'} 
                  ${isPast ? 'bg-gray-50' : ''} 
                  ${isToday ? 'bg-blue-50' : ''} 
                  ${!isCurrentMonth ? 'bg-gray-100' : ''}`}
              >
                <div className="mb-1">
                  <p className={`text-sm font-medium 
                    ${isToday ? 'text-blue-600' : ''} 
                    ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                    {day.format('D')}
                  </p>
                </div>
                
                {dayOfWeek !== 0 && daySchedules.length > 0 && isCurrentMonth && (
                  <div className="space-y-1">
                    {daySchedules.map(schedule => {
                      const isBooked = userBookings.includes(schedule.id)
                      const currentBookings = Math.max(0, schedule.current_bookings) // Ensure never negative
                      const isFull = currentBookings >= schedule.max_capacity
                      const spotsAvailable = Math.max(0, schedule.max_capacity - currentBookings)
                      const classTime = moment(`${schedule.class_date} ${schedule.start_time}`)
                      const isPastClass = classTime.isBefore(moment())
                      
                      return (
                        <div
                          key={schedule.id}
                          className={`text-xs p-1 rounded cursor-pointer transition-all
                            ${isBooked ? 'bg-green-100 text-green-800' : 
                              isFull ? 'bg-red-100 text-red-800' : 
                              isPastClass ? 'bg-gray-100 text-gray-500' : 
                              'bg-stone-100 hover:bg-stone-200'}`}
                          onClick={() => !isPastClass && !isBooked && !isFull && handleSelectSchedule(schedule)}
                        >
                          <p className="font-medium text-[11px]">
                            {moment(schedule.start_time, 'HH:mm:ss').format('h:mm A')}
                          </p>
                          {viewMode === 'week' && (
                            <>
                              <p className="truncate">{schedule.class_name}</p>
                              {!isBooked && !isFull && !isPastClass && (
                                <p className="text-[10px]">{spotsAvailable} spots</p>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
            </div>
          </>
        )}
      </div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Book Class</DialogTitle>
            <DialogDescription>
              Review class details and confirm your booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {moment(selectedSchedule.class_date).format('dddd, MMMM D, YYYY')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {moment(selectedSchedule.start_time, 'HH:mm:ss').format('h:mm A')} - {moment(selectedSchedule.end_time, 'HH:mm:ss').format('h:mm A')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSchedule.instructor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {Math.max(0, selectedSchedule.max_capacity - Math.max(0, selectedSchedule.current_bookings))} spots available
                  </span>
                  <span className="text-muted-foreground">
                    ({Math.max(0, selectedSchedule.current_bookings)}/{selectedSchedule.max_capacity} filled)
                  </span>
                </div>
              </div>

              <div className="bg-stone-100 p-4 rounded">
                <h4 className="font-medium mb-2">{selectedSchedule.class_name}</h4>
                
                {totalClassesAvailable === 0 ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    No classes available - purchase a package first
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You have {totalClassesAvailable} {totalClassesAvailable === 1 ? 'class' : 'classes'} available
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBookingModalOpen(false)}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookClass}
              disabled={loading || totalClassesAvailable === 0}
              className="rounded-none"
            >
              {loading ? 'Booking...' : 'Book Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}