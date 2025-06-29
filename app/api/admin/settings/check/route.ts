import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = token 
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if settings table exists by trying to query it
    const { data, error } = await supabase
      .from('settings')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Settings table check error:', error)
      
      // If error code indicates table doesn't exist
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return NextResponse.json({ 
          exists: false,
          error: 'Settings table does not exist',
          message: 'Please run the migration to create the settings table'
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        exists: false,
        error: error.message 
      }, { status: 500 })
    }
    
    // Count the settings
    const { count } = await supabase
      .from('settings')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({ 
      exists: true,
      count: count || 0,
      message: count === 0 ? 'Table exists but has no settings' : 'Table exists with settings'
    })
  } catch (error) {
    console.error('Settings check API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}