// Script to create Mercado Pago test users
// Run with: node scripts/create-mercadopago-test-user.js

const accessToken = 'TEST-5466291913232363-062517-6a86f93ae86bc91756ac8b5292f4773c-2519133470';

async function createTestUser() {
  try {
    const response = await fetch('https://api.mercadopago.com/users/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        site_id: 'MLM' // MLM for Mexico
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create test user: ${error}`);
    }

    const testUser = await response.json();
    
    console.log('✅ Test user created successfully!\n');
    console.log('=== SAVE THESE CREDENTIALS ===');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log(`Nickname: ${testUser.nickname}`);
    console.log(`ID: ${testUser.id}`);
    console.log('==============================\n');
    console.log('Use this account to make test purchases.');
    console.log('Login at: https://www.mercadopago.com.mx/');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

// Create the test user
createTestUser();