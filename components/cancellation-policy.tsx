'use client'

import { useEffect, useState } from 'react'

export function CancellationPolicy() {
  const [hours, setHours] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/studio/booking-policy', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Policy unavailable')
        const data = await response.json()
        if (typeof data.cancellationWindowHours !== 'number' || !Number.isFinite(data.cancellationWindowHours) || data.cancellationWindowHours < 0) {
          throw new Error('Invalid policy')
        }
        if (!controller.signal.aborted) setHours(data.cancellationWindowHours)
      })
      .catch(() => { /* Keep the neutral wording when the current policy cannot be loaded. */ })
    return () => controller.abort()
  }, [])

  if (hours === null) return <>Check the cancellation deadline shown in your account before booking, or contact the studio for the current policy.</>
  if (hours === 0) return <>Cancel before class starts to get your class credit back.</>
  return <>Cancel at least {hours} {hours === 1 ? 'hour' : 'hours'} before class starts to get your class credit back.</>
}
