# Payment Setup Guide for Talasofilia Pilates

This guide will help you set up Stripe payments for your Pilates studio website.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Your Supabase database set up with the initial schema
3. The application running locally or deployed

## Step 1: Get Your Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key**: Starts with `pk_test_` (for testing) or `pk_live_` (for production)
   - **Secret key**: Starts with `sk_test_` (for testing) or `sk_live_` (for production)

## Step 2: Set Up Environment Variables

1. Open your `.env.local` file
2. Replace the placeholder values with your actual Stripe keys:

```env
# For testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE

# For production (when ready)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE
```

## Step 3: Set Up Webhooks

### For Local Development:

1. Install the Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows/Linux
   # Download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

### For Production:

1. In your Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the signing secret and add it to your production environment variables

## Step 4: Create Class Packages in Database

Run this SQL in your Supabase SQL editor to create some sample packages:

```sql
INSERT INTO public.class_packages (name, description, number_of_classes, price, validity_days, is_active) VALUES
('Single Class', 'Perfect for trying out our studio', 1, 350, 30, true),
('4 Class Package', 'Great for regular practice', 4, 1200, 60, true),
('8 Class Package', 'Ideal for committed practitioners', 8, 2000, 90, true),
('12 Class Package', 'Best value for dedicated students', 12, 2700, 120, true);
```

## Step 5: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Make sure Stripe CLI is listening (if testing locally):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Go to `/dashboard/buy-classes`
4. Click on a package to purchase
5. Use test card details:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

6. Complete the purchase
7. Check your database:
   - A new record should appear in `user_purchases` table
   - Payment status should be `completed`
   - Classes remaining should match the package

## Troubleshooting

### "Payment system not configured" error
- Make sure your Stripe keys are set in `.env.local`
- Restart your development server after adding environment variables

### Webhook not working
- Ensure Stripe CLI is running and forwarding to the correct URL
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Look for errors in your terminal where Stripe CLI is running

### Purchase not showing in database
- Check the Stripe Dashboard for the payment
- Look at your server logs for any errors
- Verify your Supabase connection is working
- Check that the webhook endpoint is receiving events

### Common webhook errors
- "Invalid signature": Your webhook secret doesn't match
- "No signatures found": The stripe-signature header is missing
- Database errors: Check your Supabase connection and table permissions

## Production Checklist

Before going live:

- [ ] Switch to live Stripe keys
- [ ] Set up production webhook endpoint in Stripe Dashboard
- [ ] Update all environment variables in your production environment
- [ ] Test with a real card in live mode
- [ ] Set up proper error monitoring
- [ ] Configure Stripe to send email receipts
- [ ] Review and adjust pricing as needed

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Check server logs for detailed error messages