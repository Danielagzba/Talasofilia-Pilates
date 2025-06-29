'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'

interface Package {
  id: string
  name: string
  description: string
  number_of_classes: number
  price: number
  validity_days: number
}

interface AddCreditsModalProps {
  userId: string
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export function AddCreditsModal({ userId, userName, onClose, onSuccess }: AddCreditsModalProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      
      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }

      const data = await response.json()
      setPackages(data.packages || [])
      if (data.packages && data.packages.length > 0) {
        setSelectedPackageId(data.packages[0].id)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPackageId) {
      toast.error('Please select a package')
      return
    }

    setSubmitting(true)
    const selectedPackage = packages.find(p => p.id === selectedPackageId)
    if (!selectedPackage) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackageId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add credits')
      }

      toast.success(`Successfully added ${selectedPackage.number_of_classes} credits to ${userName}`)
      onSuccess()
    } catch (error) {
      console.error('Error adding credits:', error)
      toast.error('Failed to add credits')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-md my-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <CardTitle className="pr-8">Add Class Credits</CardTitle>
          <CardDescription className="pr-8">
            Add credits for {userName} (cash payment)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Package</Label>
                <RadioGroup value={selectedPackageId} onValueChange={setSelectedPackageId} className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-start space-x-3 space-y-0 p-3 rounded-lg border hover:bg-stone-50 transition-colors">
                      <RadioGroupItem value={pkg.id} className="mt-1" />
                      <label htmlFor={pkg.id} className="flex-1 cursor-pointer text-left">
                        <div className="grid gap-1.5 leading-none">
                          <div className="font-medium">
                            {pkg.name} - ${pkg.price}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pkg.number_of_classes} classes • Valid for {pkg.validity_days} days
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pkg.description}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="bg-stone-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Summary</h4>
                {selectedPackageId && packages.find(p => p.id === selectedPackageId) && (
                  <div className="space-y-1 text-sm">
                    <p className="break-words">Package: {packages.find(p => p.id === selectedPackageId)?.name}</p>
                    <p>Credits: {packages.find(p => p.id === selectedPackageId)?.number_of_classes} classes</p>
                    <p>Amount: ${packages.find(p => p.id === selectedPackageId)?.price}</p>
                    <p>Expires: {format(addDays(new Date(), packages.find(p => p.id === selectedPackageId)?.validity_days || 0), 'MMM d, yyyy')}</p>
                    <p className="text-muted-foreground mt-2">Payment method: Cash (in-person)</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedPackageId}
                  className="flex-1 min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Credits'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}