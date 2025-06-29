import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { user }, error: userError } = token 
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Use service client for admin operations to bypass RLS
    const serviceSupabase = createServiceSupabaseClient()
    
    // Fetch all settings
    const { data: settings, error } = await serviceSupabase
      .from('settings')
      .select('key, value')
    
    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
    
    // Convert array to object for easier access and parse JSON values
    const settingsObject = settings?.reduce((acc, setting) => {
      try {
        // Try to parse the value if it's a JSON string
        acc[setting.key] = JSON.parse(setting.value)
      } catch {
        // If parsing fails, use the raw value
        acc[setting.key] = setting.value
      }
      return acc
    }, {} as Record<string, any>) || {}
    
    console.log('[Settings API] Loaded settings:', settingsObject)
    
    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { user }, error: userError } = token 
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Use service client for admin operations to bypass RLS
    const serviceSupabase = createServiceSupabaseClient()
    
    // Get settings from request body
    const settings = await request.json()
    console.log('[Settings API] Received settings to save:', settings)
    
    // Update each setting
    const updates = await Promise.all(
      Object.entries(settings).map(async ([key, value]) => {
        console.log(`[Settings API] Updating ${key} to:`, value)
        
        const { data, error } = await serviceSupabase
          .from('settings')
          .upsert({ 
            key, 
            value: JSON.stringify(value) 
          }, { 
            onConflict: 'key' 
          })
          .select()
        
        if (error) {
          console.error(`[Settings API] Error updating ${key}:`, error)
          return { key, error }
        }
        
        console.log(`[Settings API] Successfully updated ${key}`)
        return { key, data }
      })
    )
    
    // Check for errors
    const errors = updates.filter(result => 'error' in result && result.error)
    if (errors.length > 0) {
      console.error('[Settings API] Settings update errors:', errors)
      return NextResponse.json({ 
        error: 'Failed to update some settings',
        details: errors.map(e => ({
          key: e.key,
          error: e.error.message
        }))
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}