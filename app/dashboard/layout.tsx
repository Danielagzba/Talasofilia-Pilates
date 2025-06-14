'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/auth-context'
import { useAdmin } from '../../hooks/use-admin'
import Link from 'next/link'
import { User, Calendar, ShoppingBag, History, Loader2, Shield, Users, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePathname } from 'next/navigation'

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
  { name: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
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