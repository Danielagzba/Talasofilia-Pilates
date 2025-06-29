// Test script to verify purchases are being created and retrieved correctly
// Run with: node scripts/test-purchases.js

const TEST_USER_ID = process.argv[2];
const ADMIN_TOKEN = process.argv[3];

if (!TEST_USER_ID || !ADMIN_TOKEN) {
  console.error('Usage: node scripts/test-purchases.js <user-id> <admin-token>');
  console.error('You can get the admin token from the browser console while logged in as admin:');
  console.error('localStorage.getItem("supabase.auth.token")');
  process.exit(1);
}

const BASE_URL = 'http://localhost:3000'; // Adjust if needed

async function testPurchases() {
  console.log('Testing purchases for user:', TEST_USER_ID);
  console.log('-----------------------------------\n');

  // Step 1: Check existing purchases via debug endpoint
  console.log('1. Checking existing purchases via debug endpoint...');
  try {
    const debugResponse = await fetch(`${BASE_URL}/api/admin/debug/purchases/${TEST_USER_ID}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    if (!debugResponse.ok) {
      console.error('Debug endpoint failed:', debugResponse.status, await debugResponse.text());
    } else {
      const debugData = await debugResponse.json();
      console.log('Service client purchases:', debugData.totalServiceClient);
      console.log('Regular client purchases:', debugData.totalRegularClient);
      console.log('RLS Error:', debugData.rlsError || 'None');
      console.log('');
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
  }

  // Step 2: Check via profile endpoint
  console.log('2. Checking purchases via profile endpoint...');
  try {
    const profileResponse = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/profile`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    if (!profileResponse.ok) {
      console.error('Profile endpoint failed:', profileResponse.status, await profileResponse.text());
    } else {
      const profileData = await profileResponse.json();
      console.log('Profile purchases count:', profileData.purchases?.length || 0);
      if (profileData.purchases && profileData.purchases.length > 0) {
        console.log('Latest purchase:', {
          id: profileData.purchases[0].id,
          package: profileData.purchases[0].class_packages?.name,
          date: profileData.purchases[0].purchase_date
        });
      }
      console.log('');
    }
  } catch (error) {
    console.error('Profile endpoint error:', error);
  }

  // Step 3: Get available packages
  console.log('3. Getting available packages...');
  let packageId = null;
  try {
    const packagesResponse = await fetch(`${BASE_URL}/api/packages`);
    if (!packagesResponse.ok) {
      console.error('Packages endpoint failed:', packagesResponse.status);
    } else {
      const packagesData = await packagesResponse.json();
      if (packagesData.packages && packagesData.packages.length > 0) {
        packageId = packagesData.packages[0].id;
        console.log('Using package:', packagesData.packages[0].name, '(ID:', packageId, ')');
      } else {
        console.error('No packages available');
      }
      console.log('');
    }
  } catch (error) {
    console.error('Packages endpoint error:', error);
  }

  // Step 4: Add credits if we have a package
  if (packageId) {
    console.log('4. Adding credits...');
    try {
      const creditsResponse = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ packageId })
      });
      
      if (!creditsResponse.ok) {
        console.error('Credits endpoint failed:', creditsResponse.status, await creditsResponse.text());
      } else {
        const creditsData = await creditsResponse.json();
        console.log('Credits added successfully!');
        console.log('Purchase ID:', creditsData.data?.id);
        console.log('');
      }
    } catch (error) {
      console.error('Credits endpoint error:', error);
    }

    // Step 5: Re-check purchases after adding credits
    console.log('5. Re-checking purchases after adding credits...');
    
    // Wait a moment for any potential replication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const debugResponse = await fetch(`${BASE_URL}/api/admin/debug/purchases/${TEST_USER_ID}`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Service client purchases:', debugData.totalServiceClient);
        console.log('Regular client purchases:', debugData.totalRegularClient);
        console.log('');
      }
    } catch (error) {
      console.error('Debug re-check error:', error);
    }

    try {
      const profileResponse = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/profile`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Profile purchases count:', profileData.purchases?.length || 0);
      }
    } catch (error) {
      console.error('Profile re-check error:', error);
    }
  }
}

testPurchases().catch(console.error);