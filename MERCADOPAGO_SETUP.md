# Mercado Pago Setup Guide

This guide will help you set up Mercado Pago for accepting payments in the Talasofilia Pilates application.

## Prerequisites

1. A Mercado Pago account (create one at https://www.mercadopago.com.mx/)
2. Access to your Supabase database

## Step 1: Get Your Mercado Pago Credentials

1. Log in to your Mercado Pago account
2. Go to the [Developer Panel](https://www.mercadopago.com/developers/panel)
3. Create a new application or select an existing one
4. Navigate to "Credentials" section
5. You'll see two sets of credentials:
   - **Test Credentials**: For development and testing
   - **Production Credentials**: For live payments

### Test Credentials
- Access Token: `TEST-xxxx-xxxx-xxxx-xxxx`
- Public Key: `TEST-xxxx-xxxx-xxxx-xxxx`

### Production Credentials
- Access Token: `APP_USR-xxxx-xxxx-xxxx-xxxx`
- Public Key: `APP_USR-xxxx-xxxx-xxxx-xxxx`

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.mercadopago.example .env.local
   ```

2. Update `.env.local` with your credentials:
   ```env
   # For testing
   MERCADOPAGO_ACCESS_TOKEN=TEST-your-test-access-token
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-test-public-key
   
   # For production (remove TEST- prefix)
   # MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-production-access-token
   # NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-your-production-public-key
   
   # Your app URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 3: Run Database Migration

1. Go to your Supabase SQL Editor
2. Run the migration script from `/supabase/migrations/20250625_migrate_to_mercado_pago.sql`
3. This will add Mercado Pago fields to your database

## Step 4: Install Dependencies

```bash
npm install mercadopago
```

## Step 5: Configure Webhooks

For production, you need to configure webhooks to receive payment notifications:

1. In the Mercado Pago Developer Panel, go to "Webhooks"
2. Add a new webhook with URL: `https://your-domain.com/api/mercadopago/webhook`
3. Select the following events:
   - Payment created
   - Payment updated

## Step 6: Test the Integration

### Using Test Cards

Mercado Pago provides test credit cards for different scenarios:

- **Approved Payment**: 5031 7557 3453 0604
  - CVV: 123
  - Expiry: 11/25
  - Name: APRO
  - ID: 12345678

- **Rejected Payment**: 5031 7557 3453 0604
  - CVV: 123
  - Expiry: 11/25
  - Name: OTHE
  - ID: 12345678

- **Pending Payment**: 5031 7557 3453 0604
  - CVV: 123
  - Expiry: 11/25
  - Name: CONT
  - ID: 12345678

### Test Flow

1. Start your development server: `npm run dev`
2. Navigate to `/dashboard/buy-classes`
3. Select a package and click "Purchase"
4. You'll be redirected to Mercado Pago checkout
5. Use a test card to complete the payment
6. You'll be redirected back to your app

## Payment Flow Overview

1. User selects a package on `/dashboard/buy-classes`
2. App creates a payment preference via `/api/mercadopago/checkout`
3. User is redirected to Mercado Pago checkout
4. After payment, user returns to:
   - `/dashboard/checkout/success` for approved payments
   - `/dashboard/checkout/pending` for pending payments
   - `/dashboard/buy-classes` for failed/cancelled payments
5. Mercado Pago sends webhook notification to `/api/mercadopago/webhook`
6. Webhook creates purchase record and sends confirmation email

## Troubleshooting

### Common Issues

1. **"Payment system not configured" error**
   - Make sure `MERCADOPAGO_ACCESS_TOKEN` is set in your environment variables
   - Restart your development server after adding environment variables

2. **Webhook not receiving notifications**
   - Check that your webhook URL is publicly accessible
   - Verify webhook configuration in Mercado Pago panel
   - Check server logs for webhook errors

3. **Payment not showing in purchase history**
   - Webhook might still be processing (wait a few seconds)
   - Check Supabase logs for database errors
   - Verify the payment status in Mercado Pago panel

## Going to Production

1. Replace TEST credentials with production credentials
2. Update webhook URL to production domain
3. Test with real payments (small amounts)
4. Monitor webhook logs for the first few transactions

## Support

- Mercado Pago Documentation: https://www.mercadopago.com.mx/developers/es/docs
- API Reference: https://www.mercadopago.com.mx/developers/es/reference
- Support: https://www.mercadopago.com.mx/developers/es/support