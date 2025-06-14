'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/auth-context'
import { useAdmin } from '../../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { createClient } from '../../../../lib/supabase'
import { Loader2, Search, User, Mail, Calendar, ShoppingBag } from 'lucide-react'
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
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

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
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_purchases (
            id,
            classes_remaining,
            total_classes,
            expiry_date,
            payment_status,
            class_packages (
              name
            )
          ),
          class_bookings (
            id,
            booking_status,
            class_schedules (
              class_name,
              class_date,
              start_time
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setUsers(data)
        setFilteredUsers(data)
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

  const openViewDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
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
          Manage <span className="font-medium italic">Users</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and manage user accounts and their class packages
        </p>
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
                      onClick={() => openViewDialog(userItem)}
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

      {/* View User Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name || 'Unknown User'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span> {selectedUser.id}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Member Since:</span> {new Date(selectedUser.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Admin:</span> {selectedUser.is_admin ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* Active Packages */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Active Class Packages
                </h3>
                {getActivePackages(selectedUser.user_purchases || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active packages</p>
                ) : (
                  <div className="space-y-2">
                    {getActivePackages(selectedUser.user_purchases || []).map((purchase: any) => (
                      <div key={purchase.id} className="p-3 bg-stone-50 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{purchase.class_packages?.name}</span>
                          <span>{purchase.classes_remaining}/{purchase.total_classes} classes</span>
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Expires: {new Date(purchase.expiry_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Classes */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Classes
                </h3>
                {getUpcomingClasses(selectedUser.class_bookings || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming classes</p>
                ) : (
                  <div className="space-y-2">
                    {getUpcomingClasses(selectedUser.class_bookings || []).slice(0, 5).map((booking: any) => (
                      <div key={booking.id} className="p-3 bg-stone-50 rounded text-sm">
                        <div className="font-medium">{booking.class_schedules.class_name}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(`${booking.class_schedules.class_date} ${booking.class_schedules.start_time}`).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                    {getUpcomingClasses(selectedUser.class_bookings || []).length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{getUpcomingClasses(selectedUser.class_bookings || []).length - 5} more classes
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}