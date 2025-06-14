# Apply Admin Migration

## IMPORTANT: Fix for Infinite Recursion Error

If you're getting an "infinite recursion detected" error, first run the SQL from `fix-admin-policies.sql` file to fix the policies before proceeding.

Since the automated migration is having issues, please run this SQL directly in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Add is_admin column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin);

-- Create admin policies for class_schedules
-- Admins can insert new class schedules
CREATE POLICY "Admins can insert schedules" ON public.class_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update class schedules
CREATE POLICY "Admins can update schedules" ON public.class_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete class schedules
CREATE POLICY "Admins can delete schedules" ON public.class_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create admin policies for class_packages
-- Admins can insert new packages
CREATE POLICY "Admins can insert packages" ON public.class_packages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update packages
CREATE POLICY "Admins can update packages" ON public.class_packages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete packages
CREATE POLICY "Admins can delete packages" ON public.class_packages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create admin policies for viewing all data
-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases" ON public.user_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON public.class_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update bookings (for managing no-shows, etc)
CREATE POLICY "Admins can update all bookings" ON public.class_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the view schedules policy to allow admins to see cancelled classes
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.class_schedules;

CREATE POLICY "Users can view schedules" ON public.class_schedules
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_cancelled = false OR 
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = true
      )
    )
  );
```

5. Run the query

## Make Yourself an Admin

After running the migration, to make yourself an admin:

1. In the SQL editor, run this query (replace YOUR_EMAIL with your actual email):

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'YOUR_EMAIL'
);
```

2. After this, refresh your app and you should see the admin sections in your dashboard!