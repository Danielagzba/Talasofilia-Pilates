'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/auth-context'
import { useAdmin } from '../../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { createClient } from '../../../../lib/supabase'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  display_name: string
  created_at: string
  is_admin: boolean
  user_purchases?: any[]
  class_bookings?: any[]
}

export default function ManageUsersPage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    console.log('Admin status:', { isAdmin, adminLoading, user })
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router, user])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      // First, let's check if the current user is an admin
      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single()

      console.log('Current user admin status:', currentUserProfile)
      setDebugInfo(currentUserProfile)

      // First, try to get just the user profiles without joins
      const { data: profilesOnly, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Profiles only query:', { profilesOnly, profilesError })

      // Since there's no direct foreign key between user_profiles and other tables,
      // we'll fetch the data separately and combine it
      if (profilesOnly && profilesOnly.length > 0) {
        // Get all user IDs
        const userIds = profilesOnly.map(p => p.id)
        
        // Fetch purchases for all users
        const { data: allPurchases } = await supabase
          .from('user_purchases')
          .select(`
            *,
            class_packages (
              name
            )
          `)
          .in('user_id', userIds)
        
        // Fetch bookings for all users
        const { data: allBookings } = await supabase
          .from('class_bookings')
          .select(`
            *,
            class_schedules (
              class_name,
              class_date,
              start_time
            )
          `)
          .in('user_id', userIds)
        
        // Combine the data
        const usersWithData = profilesOnly.map(profile => ({
          ...profile,
          user_purchases: allPurchases?.filter(p => p.user_id === profile.id) || [],
          class_bookings: allBookings?.filter(b => b.user_id === profile.id) || []
        }))
        
        console.log('Combined user data:', usersWithData)
        setUsers(usersWithData)
        setFilteredUsers(usersWithData)
      } else {
        console.log('No user profiles found')
        setUsers([])
        setFilteredUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      toast.success(`Admin privileges ${currentStatus ? 'removed' : 'granted'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating admin status:', error)
      toast.error('Failed to update admin status')
    }
  }

  const getActivePackages = (purchases: any[]) => {
    if (!purchases) return []
    const now = new Date()
    return purchases.filter(p => 
      p.payment_status === 'completed' && 
      new Date(p.expiry_date) > now &&
      p.classes_remaining > 0
    )
  }

  const getTotalClassesRemaining = (purchases: any[]) => {
    const activePackages = getActivePackages(purchases)
    return activePackages.reduce((sum, p) => sum + p.classes_remaining, 0)
  }

  const getUpcomingClasses = (bookings: any[]) => {
    if (!bookings) return []
    const now = new Date()
    return bookings.filter(b => {
      if (b.booking_status !== 'confirmed') return false
      const classDate = new Date(`${b.class_schedules.class_date} ${b.class_schedules.start_time}`)
      return classDate > now
    })
  }

  const handleRefreshAuth = async () => {
    // Force refresh the session
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      window.location.reload()
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have admin access to view this page.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Debug Info: isAdmin={String(isAdmin)}, adminLoading={String(adminLoading)}
          </p>
          <Button onClick={handleRefreshAuth} variant="outline">
            Refresh Authentication
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-serif text-3xl font-light">
            Manage <span className="font-medium italic">Users</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            View and manage user accounts and their class packages
          </p>
        </div>
        {users.length === 0 && !loading && (
          <div className="text-sm bg-red-50 p-4 rounded-lg max-w-2xl">
            <p className="font-medium text-red-800 mb-2">Database Permission Issue</p>
            <p className="text-red-700 mb-3">The admin policies need to be fixed to allow viewing all users.</p>
            <p className="text-red-700 font-medium">To fix this issue:</p>
            <ol className="list-decimal list-inside text-red-700 space-y-1 mt-2">
              <li>Go to your Supabase SQL Editor</li>
              <li>Run the SQL script in: <code className="bg-red-100 px-1 py-0.5 rounded">fix-admin-access-emergency.sql</code></li>
              <li>Check your admin status after running the script</li>
              <li>Refresh this page</li>
            </ol>
            <p className="text-red-700 mt-3">
              If you've lost admin access, you may need to manually update your user record in the database.
            </p>
            {debugInfo && (
              <div className="mt-3 p-2 bg-red-100 rounded">
                <p className="text-xs font-mono">Debug: is_admin = {String(debugInfo.is_admin)}</p>
                <p className="text-xs font-mono">Hook: isAdmin = {String(isAdmin)}</p>
                <p className="text-xs font-mono">User ID: {user?.id}</p>
                <p className="text-xs text-red-700 mt-2">Check browser console for query results</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} users found
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((userItem) => {
          const activePackages = getActivePackages(userItem.user_purchases || [])
          const totalClasses = getTotalClassesRemaining(userItem.user_purchases || [])
          const upcomingClasses = getUpcomingClasses(userItem.class_bookings || [])
          
          return (
            <Card key={userItem.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {userItem.display_name || 'Unknown User'}
                      {userItem.is_admin && (
                        <Badge variant="secondary" className="ml-2">Admin</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      ID: {userItem.id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/users/${userItem.id}`)}
                    >
                      View Details
                    </Button>
                    {userItem.id !== user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminStatus(userItem.id, userItem.is_admin)}
                      >
                        {userItem.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Classes</p>
                    <p className="font-medium">{totalClasses} remaining</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Upcoming Bookings</p>
                    <p className="font-medium">{upcomingClasses.length} classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}