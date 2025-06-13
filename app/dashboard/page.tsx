'use client'

import { useState } from 'react'
import { useAuth } from '../../contexts/auth-context'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { User, Mail, Camera, ShoppingBag, Calendar } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const supabase = createClient()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

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
                <AvatarImage src={photoURL || user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-md cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <Camera className="h-4 w-4" />
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
            <p className="text-2xl font-bold">0 Classes</p>
            <p className="text-sm text-muted-foreground mt-1">
              No active class packages
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 rounded-none w-full"
            >
              <Link href="/dashboard/buy-classes">Buy Classes</Link>
            </Button>
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
            <p className="text-2xl font-bold">0 Classes</p>
            <p className="text-sm text-muted-foreground mt-1">
              No upcoming bookings
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 rounded-none w-full"
            >
              <Link href="/dashboard/book-class">Book a Class</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}