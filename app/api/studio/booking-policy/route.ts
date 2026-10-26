import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Publish only this numeric policy, never the complete administrative settings.
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cancellation_window_hours')
      .maybeSingle()
    if (error) throw error
    const value = data?.value ?? 24 // Same missing-setting default as mobile_booking_policy().
    const hours = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
      ? Number(value) : NaN
    if (!Number.isFinite(hours) || hours < 0 || hours > 8760) {
      throw new Error('Invalid cancellation window')
    }
    return NextResponse.json({ cancellationWindowHours: hours }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Cancellation policy unavailable' }, { status: 503 })
  }
}
