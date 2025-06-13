# Testing Stripe Integration Locally

## 1. Install Stripe CLI
```bash
# On macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

## 2. Login to Stripe
```bash
stripe login
```

## 3. Forward webhooks to your local server
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook signing secret like `whsec_abcd1234...`
Add this to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`

## 4. Test a purchase
1. Go to http://localhost:3000/dashboard/buy-classes
2. Click "Purchase" on any package
3. Use test card: 4242 4242 4242 4242
4. Any future expiry date and any CVC
5. Complete the purchase

## 5. Verify the purchase
- Check your Supabase dashboard → Table Editor → user_purchases
- You should see a new purchase record with status 'completed'
- The user should now have classes available to book

## 6. Test booking
1. Go to http://localhost:3000/dashboard/book-class
2. You should see your available classes count
3. Click on any available class to book
4. Confirm the booking

## 7. Verify the booking
- Check My Classes page
- Check Supabase dashboard → class_bookings table
- The class_schedules table should show updated booking count

## Common Issues:

### Webhook not receiving events
- Make sure `stripe listen` is running
- Check that your webhook endpoint URL is correct
- Verify the webhook secret is properly set in .env.local

### Purchase not showing up
- Check Stripe Dashboard for the payment
- Check browser console for errors
- Verify Supabase connection is working

### Can't book classes
- Ensure you have an active purchase with classes_remaining > 0
- Check that the class isn't full or in the past
- Verify the booking triggers are working in Supabase