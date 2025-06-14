# Email Notifications Setup

This document explains the email notification system implemented for Talasofilia Pilates.

## Overview

The application sends automated emails for the following events:
1. **Welcome Email** - Sent when a new user creates an account
2. **Class Reminder** - Sent 1 hour before a booked class starts
3. **Class Cancellation** - Sent when a user cancels their booking
4. **Purchase Confirmation** - Sent after successful class package purchase

## Setup Instructions

### 1. Resend Configuration

1. Sign up for a Resend account at https://resend.com
2. Verify your email domain or use the default `@resend.dev` domain
3. Generate an API key from the Resend dashboard
4. Add the API key to your `.env.local` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Environment Variables

Add these variables to your `.env.local` file:

```env
# Resend API Key
RESEND_API_KEY=your_resend_api_key_here

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production

# Cron secret for Vercel cron jobs
CRON_SECRET=your_random_secret_here  # Generate a secure random string
```

### 3. Database Migration

Run the migration to add the `welcomed` column:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL editor
ALTER TABLE user_profiles
ADD COLUMN welcomed BOOLEAN DEFAULT FALSE;

UPDATE user_profiles SET welcomed = TRUE WHERE welcomed IS NULL;
```

### 4. Vercel Deployment

When deploying to Vercel:

1. Add all environment variables in the Vercel dashboard
2. Set `NEXT_PUBLIC_APP_URL` to your production URL
3. Generate a secure random string for `CRON_SECRET`
4. The cron job for class reminders will run automatically every hour

## Email Templates

### Welcome Email
- Triggered when a user confirms their email address
- Contains links to browse classes and purchase packages
- Only sent once per user (tracked by `welcomed` field)

### Class Reminder
- Sent 1 hour before class starts
- Includes class details, instructor, time, and location
- Contains a link to cancel if needed

### Class Cancellation
- Sent when user cancels a booking
- Confirms credit has been returned
- Includes link to book another class

### Purchase Confirmation
- Sent after successful Stripe payment
- Shows package details and number of classes
- Includes link to book first class

## Customization

### Changing Email Templates

Edit the templates in `/lib/email-service.ts`:

```typescript
export const emailTemplates = {
    welcome: (userName: string) => ({
        subject: 'Your subject here',
        html: `Your HTML template here`
    }),
    // ... other templates
}
```

### Using Custom Domain

To send from your domain instead of `@resend.dev`:

1. Add and verify your domain in Resend dashboard
2. Update the `from` address in `/lib/email-service.ts`:

```typescript
from: 'Talasofilia Pilates <info@yourdomain.com>',
```

## Testing

### Local Testing

1. Use Resend's test mode with test API keys
2. Check the Resend dashboard for sent emails
3. Use console.log to debug email sending

### Production Monitoring

1. Monitor email delivery in Resend dashboard
2. Check Vercel Functions logs for cron job execution
3. Set up webhooks in Resend for delivery notifications

## Troubleshooting

### Emails Not Sending

1. Check API key is correctly set
2. Verify Resend account is active
3. Check Vercel function logs for errors

### Cron Job Not Running

1. Verify `CRON_SECRET` is set in Vercel
2. Check Vercel Functions tab for execution logs
3. Ensure `vercel.json` is properly configured

### Welcome Email Not Sending

1. Check if user has `welcomed: true` in database
2. Verify auth state change is firing
3. Check browser console for API errors

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- The cron endpoint is protected by `CRON_SECRET`
- Email addresses are only accessible to authenticated users