import { createClient } from './supabase/server'

export interface StudioSettings {
  booking_window_hours: number
  cancellation_window_hours: number
  default_class_capacity: number
  studio_name: string
  contact_email: string | null
  phone_number: string | null
  notification_new_booking: boolean
  notification_cancellation: boolean
  notification_low_capacity: boolean
}

const DEFAULT_SETTINGS: StudioSettings = {
  booking_window_hours: 3,
  cancellation_window_hours: 24,
  default_class_capacity: 10,
  studio_name: 'Talasofilia Pilates',
  contact_email: null,
  phone_number: null,
  notification_new_booking: true,
  notification_cancellation: true,
  notification_low_capacity: true
}

export async function getSettings(): Promise<StudioSettings> {
  try {
    const supabase = await createClient()
    
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
    
    if (error) {
      console.error('Error fetching settings:', error)
      return DEFAULT_SETTINGS
    }
    
    // Convert array to object
    const settingsObject = settings?.reduce((acc, setting) => {
      const value = setting.value
      // Parse JSON strings and convert to appropriate types
      if (setting.key.includes('hours') || setting.key === 'default_class_capacity') {
        acc[setting.key] = Number(value) || DEFAULT_SETTINGS[setting.key as keyof StudioSettings]
      } else if (setting.key.includes('notification')) {
        acc[setting.key] = value === 'true'
      } else {
        acc[setting.key] = value === 'null' ? null : value
      }
      return acc
    }, {} as any) || {}
    
    return { ...DEFAULT_SETTINGS, ...settingsObject }
  } catch (error) {
    console.error('Error in getSettings:', error)
    return DEFAULT_SETTINGS
  }
}