# Mercado Pago Test Users Guide

## The "Can't pay yourself" Error

When you see "No puedes pagarte a ti mismo" (You can't pay yourself), it means you're trying to make a payment using the same Mercado Pago account that owns the access token. This is a security measure by Mercado Pago.

## Solution: Create Test Users

Mercado Pago provides a way to create test users for testing payments.

### Step 1: Create Test Users via API

Run this curl command to create a test buyer (replace with your access token):

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST-5466291913232363-062517-6a86f93ae86bc91756ac8b5292f4773c-2519133470" \
  "https://api.mercadopago.com/users/test" \
  -d '{"site_id":"MLM"}'
```

This will create a test user and return credentials like:
```json
{
  "id": 123456789,
  "nickname": "TESTUSER123456",
  "password": "qatest123",
  "site_status": "active",
  "email": "test_user_123456@testuser.com"
}
```

### Step 2: Save Test User Credentials

Create multiple test users and save their credentials. You'll need at least:
1. **One seller account** (the one with your access token)
2. **One or more buyer accounts** (for testing purchases)

### Step 3: Test Purchase Flow

1. Use your main account (with the access token) as the SELLER
2. Log in to Mercado Pago with a TEST BUYER account when making purchases
3. Use the test credit cards provided in the documentation

## Alternative: Test in Production Mode

If you want to test with real accounts (but still in test mode):

1. Create a separate Mercado Pago account for testing purchases
2. Use that account when going through the checkout flow
3. Use test credit cards for payment

## Quick Test Setup

For immediate testing, you can:

1. Open an incognito/private browser window
2. When redirected to Mercado Pago, create a new account or use a different email
3. Use these test cards:

### Approved Payment (Visa)
- Number: 4075 5957 1648 3764
- CVV: 123
- Expiry: 11/25
- Name: APRO
- DNI: 12345678

### Approved Payment (Mastercard)
- Number: 5031 7557 3453 0604
- CVV: 123
- Expiry: 11/25
- Name: APRO
- DNI: 12345678

## Testing Tips

1. **Always use different accounts**: Seller (your app) and Buyer (test user)
2. **Use test cards**: Never use real credit cards in test mode
3. **Check webhook logs**: Ensure your webhook is receiving notifications
4. **Test different scenarios**: Approved, rejected, and pending payments

## Common Test Scenarios

### Approved Payment
- Use cardholder name: APRO
- Payment will be instantly approved

### Rejected Payment
- Use cardholder name: OTHE
- Payment will be rejected

### Pending Payment
- Use cardholder name: CONT
- Payment will remain pending

## Troubleshooting

If you continue to see the "can't pay yourself" error:

1. Make sure you're not logged into Mercado Pago with your developer account
2. Clear browser cookies for Mercado Pago
3. Use an incognito window
4. Create and use a test user account

## Next Steps

Once testing is complete and working:
1. Switch to production credentials
2. Remove TEST- prefix from access token and public key
3. Update webhook URLs to production domain
4. Test with small real transactions first