# Fix Email Confirmation Redirect to Production URL

## Problem
When users sign up and confirm their email, they are redirected to localhost instead of the production URL.

## Solution

### 1. Update Supabase Dashboard Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following settings:

#### Site URL
- Change from: `http://localhost:3000`
- Change to: `https://www.talasofiliapilates.com`

#### Redirect URLs (Allowed List)
Add all your allowed redirect URLs:
```
https://www.talasofiliapilates.com/**
https://talasofiliapilates.com/**
http://localhost:3000/**
```

### 2. Update Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Check the **Confirm signup** template
3. The default template uses `{{ .SiteURL }}` which will now point to your production URL
4. If you have custom templates, ensure they use `{{ .SiteURL }}` for redirects

### 3. Environment-Specific Configuration

For better control, you can also configure redirect URLs in your auth emails:

1. In **Email Templates**, you can customize the confirmation URL:
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

### 4. Verify Settings

After making changes:
1. Create a test account
2. Check the confirmation email
3. Verify the link points to `https://www.talasofiliapilates.com`

## Additional Notes

- The Site URL is used for all auth emails (signup confirmation, password reset, magic links)
- You can have multiple redirect URLs in the allowed list for development and production
- Changes take effect immediately, no deployment needed

## Troubleshooting

If emails still redirect to localhost:
1. Clear your browser cache
2. Check if you have any hardcoded URLs in your email templates
3. Ensure your Supabase project is using the correct environment
4. Check if your local environment variables are affecting the production build