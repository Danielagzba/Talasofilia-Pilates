'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/auth-context'
import { useAdmin } from '../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { createClient } from '../../../lib/supabase'
import { Loader2, Users, Calendar, ShoppingBag, TrendingUp, Shield, FileText, Settings } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  activeClasses: number
  totalBookings: number
  totalRevenue: number
  upcomingClasses: any[]
  recentPurchases: any[]
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeClasses: 0,
    totalBookings: 0,
    totalRevenue: 0,
    upcomingClasses: [],
    recentPurchases: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats()
    }
  }, [isAdmin])

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch active classes (future classes)
      const today = new Date().toISOString().split('T')[0]
      const { data: activeClasses, count: classCount } = await supabase
        .from('class_schedules')
        .select('*', { count: 'exact' })
        .gte('class_date', today)
        .eq('is_cancelled', false)

      // Fetch total bookings
      const { count: bookingCount } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_status', 'confirmed')

      // Fetch total revenue
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('amount_paid')
        .eq('payment_status', 'completed')

      const totalRevenue = purchases?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0

      // Fetch upcoming classes with booking info
      const { data: upcomingClasses } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class_bookings (
            id,
            booking_status
          )
        `)
        .gte('class_date', today)
        .eq('is_cancelled', false)
        .order('class_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5)

      // Fetch recent purchases
      const { data: recentPurchases } = await supabase
        .from('user_purchases')
        .select(`
          *,
          user_profiles (
            display_name,
            id
          ),
          class_packages (
            name
          )
        `)
        .eq('payment_status', 'completed')
        .order('purchase_date', { ascending: false })
        .limit(5)

      setStats({
        totalUsers: userCount || 0,
        activeClasses: classCount || 0,
        totalBookings: bookingCount || 0,
        totalRevenue,
        upcomingClasses: upcomingClasses || [],
        recentPurchases: recentPurchases || []
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
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
          Admin <span className="font-medium italic">Dashboard</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your Pilates studio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClasses}</div>
            <p className="text-xs text-muted-foreground">Upcoming classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>Next 5 scheduled classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingClasses.map((classItem) => {
                const confirmedBookings = classItem.class_bookings?.filter(
                  (b: any) => b.booking_status === 'confirmed'
                ).length || 0
                
                return (
                  <div key={classItem.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{classItem.class_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(classItem.class_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })} at {classItem.start_time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Instructor: {classItem.instructor_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {confirmedBookings}/{classItem.max_capacity}
                      </p>
                      <p className="text-sm text-muted-foreground">Booked</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>Latest package purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {purchase.user_profiles?.display_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.class_packages?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${purchase.amount_paid}</p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.classes_remaining}/{purchase.total_classes} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 px-4 flex flex-col items-center gap-2 rounded-none"
          >
            <Link href="/dashboard/admin/classes">
              <Calendar className="h-6 w-6" />
              <span className="text-xs text-center">Manage Classes</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 px-4 flex flex-col items-center gap-2 rounded-none"
          >
            <Link href="/dashboard/admin/templates">
              <FileText className="h-6 w-6" />
              <span className="text-xs text-center">Class Templates</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 px-4 flex flex-col items-center gap-2 rounded-none"
          >
            <Link href="/dashboard/admin/users">
              <Users className="h-6 w-6" />
              <span className="text-xs text-center">Manage Users</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 px-4 flex flex-col items-center gap-2 rounded-none"
          >
            <Link href="/dashboard/admin/settings">
              <Settings className="h-6 w-6" />
              <span className="text-xs text-center">Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}