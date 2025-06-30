// Script to check recent purchases and webhook logs
// Run with: npx tsx scripts/check-recent-purchases.ts

import { createServiceSupabaseClient } from '../lib/supabase-server'

async function checkRecentPurchases() {
  const supabase = createServiceSupabaseClient()
  
  console.log('Checking recent purchases...\n')
  
  // Get the 5 most recent purchases
  const { data: purchases, error } = await supabase
    .from('user_purchases')
    .select(`
      *,
      user_profiles (
        display_name,
        email
      ),
      class_packages (
        name,
        number_of_classes
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching purchases:', error)
    return
  }
  
  if (!purchases || purchases.length === 0) {
    console.log('No purchases found in the database')
    return
  }
  
  console.log(`Found ${purchases.length} recent purchases:\n`)
  
  purchases.forEach((purchase, index) => {
    console.log(`${index + 1}. Purchase ID: ${purchase.id}`)
    console.log(`   User: ${purchase.user_profiles?.display_name || 'Unknown'} (${purchase.user_profiles?.email || 'No email'})`)
    console.log(`   Package: ${purchase.class_packages?.name} (${purchase.class_packages?.number_of_classes} classes)`)
    console.log(`   Date: ${new Date(purchase.created_at).toLocaleString()}`)
    console.log(`   Payment Provider: ${purchase.payment_provider || 'Unknown'}`)
    console.log(`   Payment Status: ${purchase.payment_status}`)
    console.log(`   MercadoPago Payment ID: ${purchase.mercado_pago_payment_id || 'None'}`)
    console.log(`   Classes Remaining: ${purchase.classes_remaining}/${purchase.total_classes}`)
    console.log('')
  })
  
  // Check for recent MercadoPago payments
  console.log('\nChecking specifically for MercadoPago purchases in the last 24 hours...')
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const { data: recentMP, error: mpError } = await supabase
    .from('user_purchases')
    .select('*')
    .eq('payment_provider', 'mercado_pago')
    .gte('created_at', yesterday.toISOString())
  
  if (mpError) {
    console.error('Error checking MercadoPago purchases:', mpError)
    return
  }
  
  if (!recentMP || recentMP.length === 0) {
    console.log('No MercadoPago purchases found in the last 24 hours')
    console.log('\nThis could mean:')
    console.log('1. The webhook is not configured correctly in MercadoPago')
    console.log('2. The webhook URL is not accessible from MercadoPago')
    console.log('3. The webhook is failing to process payments')
    console.log('\nCheck your MercadoPago webhook configuration at:')
    console.log('https://www.mercadopago.com.mx/developers/panel')
  } else {
    console.log(`Found ${recentMP.length} MercadoPago purchases in the last 24 hours`)
  }
}

checkRecentPurchases().catch(console.error)