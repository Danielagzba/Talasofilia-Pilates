'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/auth-context'
import { useAdmin } from '../../hooks/use-admin'
import Link from 'next/link'
import { User, Calendar, ShoppingBag, History, Loader2, Shield, Users, Settings, FileText, LayoutDashboard, CreditCard, Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePathname } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet'
import { useMobile } from '../../hooks/use-mobile'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Classes', href: '/dashboard/classes', icon: Calendar },
  { name: 'Purchases', href: '/dashboard/purchases', icon: CreditCard },
]

const adminNavigation = [
  { name: 'Admin Panel', href: '/dashboard/admin', icon: Shield },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const isMobile = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    console.log('Dashboard layout - auth state:', { user: user?.email, loading })
  }, [user, loading])

  useEffect(() => {
    // Only redirect if we're sure there's no user after loading
    if (loading === false && !user) {
      console.log('No user found after loading, redirecting to login')
      router.push('/login')
    }
  }, [user, loading, router])

  // Add timeout protection for loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached')
        setLoadingTimeout(true)
      }, 5000) // 5 second timeout

      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  // Show loader only if actually loading
  if (loading === true && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadingTimeout && loading === true) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading is taking longer than expected...</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mr-2">
            Refresh Page
          </Button>
          <Button onClick={() => router.push('/login')} variant="outline">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // If we have a user, show the dashboard
  if (user) {
    console.log('User authenticated, showing dashboard')
  } else if (loading === false) {
    // If not loading and no user, don't render anything (redirect will happen)
    return null
  }

  const NavigationContent = () => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
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
    </nav>
  )

  return (
    <div className="pt-16 min-h-screen bg-stone-50">
      <div className="container px-4 md:px-6 py-8">
        {isMobile ? (
          <>
            <div className="mb-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <div className="mt-6">
                    <NavigationContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <main className="bg-white p-6 shadow-sm">
              {children}
            </main>
          </>
        ) : (
          <div className="grid md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
              <NavigationContent />
            </aside>
            <main className="md:col-span-3 bg-white p-6 md:p-8 shadow-sm">
              {children}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}