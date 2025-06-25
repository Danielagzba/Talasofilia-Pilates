import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('[Packages API] Fetching class packages...')
  
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('class_packages')
      .select('*')
      .eq('is_active', true)
      .order('number_of_classes', { ascending: true })
    
    if (error) {
      console.error('[Packages API] Error fetching packages:', error)
      throw error
    }
    
    console.log('[Packages API] Found packages:', data?.length || 0)
    
    return NextResponse.json({ packages: data || [] })
  } catch (error) {
    console.error('[Packages API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}