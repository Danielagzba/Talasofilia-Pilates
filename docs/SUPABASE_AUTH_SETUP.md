# Supabase Authentication Setup Guide

## Fixing Email Redirect Issues

### Problem
Users receive confirmation emails that redirect to localhost instead of the production URL.

### Solution Steps

#### 1. Update Supabase Dashboard Settings

Go to your [Supabase Dashboard](https://app.supabase.com) and update these settings:

1. **Navigate to**: Settings → Authentication → URL Configuration

2. **Update Site URL**:
   - From: `http://localhost:3000`
   - To: `https://www.talasofiliapilates.com`

3. **Update Redirect URLs** (add all of these):
   ```
   https://www.talasofiliapilates.com/**
   https://talasofiliapilates.com/**
   http://localhost:3000/**
   ```

#### 2. Email Template Settings

1. Go to **Authentication → Email Templates**
2. Verify these templates use `{{ .SiteURL }}`:
   - Confirm signup
   - Reset password
   - Magic Link

Default template example:
```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email address</a></p>
```

#### 3. Code Updates (Already Implemented)

The code has been updated to:
- Use `emailRedirectTo` in the signUp function
- Redirect to `/login?confirmed=true` after email confirmation
- Show success message when email is confirmed

#### 4. Environment Variables

Ensure your production environment has:
```
NEXT_PUBLIC_APP_URL=https://www.talasofiliapilates.com
```

### Testing

1. Create a test account in production
2. Check the confirmation email
3. Verify the link points to your production domain
4. Confirm the email and verify redirect works

### Troubleshooting

If emails still redirect to localhost:

1. **Clear Cache**: Clear browser cache and cookies
2. **Check Templates**: Ensure no hardcoded localhost URLs in email templates
3. **Verify Environment**: Make sure you're updating the correct Supabase project
4. **Check Logs**: Review Supabase Auth logs for any errors

### Additional Security

Consider adding these security measures:

1. **Email Domain Verification**:
   - Add your domain to Supabase email settings
   - Use custom SMTP for better deliverability

2. **Rate Limiting**:
   - Enable rate limiting in Auth settings
   - Prevent abuse of sign-up endpoint

3. **Email Verification**:
   - Keep email verification required
   - Consider adding phone verification for sensitive operations