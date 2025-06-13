'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Calendar, CreditCard, Package } from 'lucide-react'
import { toast } from 'sonner'
import moment from 'moment'

interface Purchase {
  id: string
  purchase_date: string
  expiry_date: string
  classes_remaining: number
  total_classes: number
  amount_paid: number
  payment_status: string
  class_packages: {
    name: string
    description: string | null
  }
}

export default function PurchaseHistoryPage() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchPurchases()
    }
  }, [user])

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          class_packages (
            name,
            description
          )
        `)
        .eq('user_id', user!.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error

      if (data) {
        setPurchases(data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Failed to load purchase history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return null
    }
  }

  const isExpired = (expiryDate: string) => {
    return moment(expiryDate).isBefore(moment())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading purchase history...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-light mb-6">
        Purchase <span className="font-medium italic">History</span>
      </h1>
      <p className="text-muted-foreground mb-8">
        View your past purchases and transaction history
      </p>
      
      {purchases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No purchases yet. Start by buying a class package!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {purchases.map((purchase) => {
            const expired = isExpired(purchase.expiry_date)
            
            return (
              <Card key={purchase.id} className={expired ? 'opacity-75' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{purchase.class_packages.name}</CardTitle>
                      <CardDescription>
                        Purchased {moment(purchase.purchase_date).format('MMMM D, YYYY')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(purchase.payment_status)}
                      {expired && purchase.payment_status === 'completed' && (
                        <Badge variant="secondary" className="ml-2">Expired</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{purchase.classes_remaining} / {purchase.total_classes}</p>
                        <p className="text-muted-foreground">Classes remaining</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{moment(purchase.expiry_date).format('MMM D, YYYY')}</p>
                        <p className="text-muted-foreground">
                          {expired ? 'Expired' : 'Expires'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">${purchase.amount_paid} MXN</p>
                        <p className="text-muted-foreground">Amount paid</p>
                      </div>
                    </div>
                  </div>
                  
                  {purchase.classes_remaining > 0 && !expired && purchase.payment_status === 'completed' && (
                    <div className="mt-4 p-3 bg-stone-100 rounded text-sm">
                      You have {purchase.classes_remaining} classes remaining. Book them before they expire!
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}