// Quick test to verify RLS issues with user_purchases table
// Run with: npx tsx scripts/quick-test-rls.ts

import { createClient } from '@supabase/supabase-js'
import { createServiceSupabaseClient } from '../lib/supabase-server'

async function testRLS() {
  console.log('Testing RLS on user_purchases table...\n')

  // Get a test user ID (you should replace this with an actual user ID)
  const serviceClient = createServiceSupabaseClient()
  
  // First, get any user from user_profiles
  const { data: users, error: usersError } = await serviceClient
    .from('user_profiles')
    .select('id, display_name')
    .limit(1)
  
  if (usersError || !users || users.length === 0) {
    console.error('Could not find any users:', usersError)
    return
  }

  const testUserId = users[0].id
  console.log(`Using test user: ${users[0].display_name} (${testUserId})\n`)

  // Count purchases using service client
  const { count: serviceCount, error: serviceCountError } = await serviceClient
    .from('user_purchases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', testUserId)

  console.log('Service client results:')
  console.log('- Purchase count:', serviceCount)
  console.log('- Error:', serviceCountError?.message || 'None')
  console.log('')

  // Get actual purchases using service client
  const { data: servicePurchases, error: servicePurchasesError } = await serviceClient
    .from('user_purchases')
    .select('id, package_id, purchase_date, classes_remaining')
    .eq('user_id', testUserId)
    .limit(5)

  console.log('Service client purchases:')
  if (servicePurchases && servicePurchases.length > 0) {
    servicePurchases.forEach(p => {
      console.log(`- ${p.id}: ${p.classes_remaining} classes remaining (purchased ${p.purchase_date})`)
    })
  } else {
    console.log('- No purchases found')
  }
  console.log('')

  // Now test with a regular client (this won't work as we need auth, but shows the pattern)
  console.log('Note: Regular client test requires authentication and proper RLS policies.')
  console.log('The profile route should use the service client for admin operations to bypass RLS.')
}

testRLS().catch(console.error)