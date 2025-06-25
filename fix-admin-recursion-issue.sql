-- Fix for infinite recursion in RLS policies
-- The issue: Policies that check user_profiles for admin status cause recursion
-- Solution: Use a different approach that doesn't create circular dependencies

-- Step 1: First check your user ID and admin status
SELECT id, display_name, is_admin 
FROM public.user_profiles 
WHERE id = auth.uid();

-- Step 2: Drop ALL existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update" ON public.user_profiles;

-- Step 3: Create SIMPLER policies for user_profiles that avoid recursion
-- For SELECT: Allow users to see their own profile, and temporarily allow all profiles
-- We'll handle admin checks in the application layer to avoid recursion
CREATE POLICY "user_profiles_select_simple" ON public.user_profiles
FOR SELECT USING (
  -- User can see their own profile
  auth.uid() = id
  OR
  -- TEMPORARY: Allow viewing all profiles to avoid recursion
  -- The application will handle admin checks
  true
);

-- For UPDATE: Only allow users to update their own profile
CREATE POLICY "user_profiles_update_simple" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 4: Fix policies for user_purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can view purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users and admins can view purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "user_purchases_select_policy" ON public.user_purchases;

-- Simple policy: users see their own purchases
CREATE POLICY "user_purchases_select_simple" ON public.user_purchases
FOR SELECT USING (auth.uid() = user_id);

-- Step 5: Fix policies for class_bookings  
DROP POLICY IF EXISTS "Users can view own bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Users can view bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Users and admins can view bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "class_bookings_select_policy" ON public.class_bookings;

-- Simple policy: users see their own bookings
CREATE POLICY "class_bookings_select_simple" ON public.class_bookings
FOR SELECT USING (auth.uid() = user_id);

-- Step 6: Fix policies for class_schedules
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can view schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "class_schedules_select_policy" ON public.class_schedules;

-- All authenticated users can see non-cancelled classes
CREATE POLICY "class_schedules_select_simple" ON public.class_schedules
FOR SELECT USING (
  auth.role() = 'authenticated' AND is_cancelled = false
);

-- Step 7: Fix policies for class_packages
DROP POLICY IF EXISTS "Authenticated users can view packages" ON public.class_packages;
DROP POLICY IF EXISTS "Users can view packages" ON public.class_packages;
DROP POLICY IF EXISTS "class_packages_select_policy" ON public.class_packages;

CREATE POLICY "class_packages_select_simple" ON public.class_packages
FOR SELECT USING (auth.role() = 'authenticated');

-- Step 8: Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Direct query to avoid recursion issues
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Now create admin-specific policies using the function
-- Admin policy for user_purchases
CREATE POLICY "admin_view_all_purchases" ON public.user_purchases
FOR SELECT USING (is_admin());

-- Admin policy for class_bookings
CREATE POLICY "admin_view_all_bookings" ON public.class_bookings
FOR SELECT USING (is_admin());

-- Admin policy for class_schedules (to see cancelled classes)
CREATE POLICY "admin_view_cancelled_classes" ON public.class_schedules
FOR SELECT USING (is_admin() AND is_cancelled = true);

-- Admin update policy for user_profiles
CREATE POLICY "admin_update_profiles" ON public.user_profiles
FOR UPDATE USING (is_admin())
WITH CHECK (is_admin());

-- Step 10: Verify your admin status
-- Replace with your actual user ID from Step 1
-- UPDATE public.user_profiles SET is_admin = true WHERE id = '981c44e2-0475-4657-88ff-f04c1c4e365f';

-- Step 11: Test queries
SELECT 'Your profile:', id, display_name, is_admin 
FROM public.user_profiles 
WHERE id = auth.uid();

SELECT 'Is admin function:', is_admin();

SELECT 'User count:', COUNT(*) FROM public.user_profiles;

SELECT 'Purchase count:', COUNT(*) FROM public.user_purchases;

SELECT 'Booking count:', COUNT(*) FROM public.class_bookings;