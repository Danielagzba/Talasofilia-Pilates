'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/auth-context'
import { useAdmin } from '../../hooks/use-admin'
import Link from 'next/link'
import { User, Calendar, ShoppingBag, History, Loader2, Shield, Users, Settings, FileText, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePathname } from 'next/navigation'
import { Button } from '../../components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: User },
  { name: 'Book a Class', href: '/dashboard/book-class', icon: Calendar },
  { name: 'My Classes', href: '/dashboard/my-classes', icon: Calendar },
  { name: 'Buy Classes', href: '/dashboard/buy-classes', icon: ShoppingBag },
  { name: 'Purchase History', href: '/dashboard/purchase-history', icon: History },
]

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/dashboard/admin', icon: Shield },
  { name: 'Manage Classes', href: '/dashboard/admin/classes', icon: Calendar },
  { name: 'Class Templates', href: '/dashboard/admin/templates', icon: FileText },
  { name: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const { isAdmin, loading: adminLoading, error: adminError } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  console.log('[DashboardLayout] Render:', {
    userId: user?.id,
    authLoading: loading,
    isAdmin,
    adminLoading,
    adminError,
    pathname,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    // Only redirect if we're sure there's no user after loading
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true)
      router.push('/login')
    }
  }, [user, loading, router, isRedirecting])

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if redirecting to login
  if (!user || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-stone-50">
      <div className="container px-4 md:px-6 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
              
              {isAdmin && (
                <>
                  <div className="border-t my-4 pt-4">
                    <p className="px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                      Admin
                    </p>
                    {adminNavigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center px-4 py-3 text-sm font-medium transition-colors',
                            pathname === item.href
                              ? 'bg-stone-100 text-stone-900'
                              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                          )}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
              
              <div className="border-t mt-6 pt-6">
                <Button
                  onClick={async () => {
                    await signOut()
                    router.push('/')
                    // Force reload to clear state
                    window.location.href = '/'
                  }}
                  variant="ghost"
                  className="w-full justify-start text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </nav>
          </aside>
          <main className="md:col-span-3 bg-white p-6 md:p-8 shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}