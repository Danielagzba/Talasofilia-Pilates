-- Comprehensive fix for admin access and RLS policies
-- Run this in Supabase SQL Editor

-- Step 1: First, check your current user ID and admin status
SELECT id, display_name, is_admin 
FROM public.user_profiles 
WHERE id = auth.uid();

-- Step 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;

-- Step 3: Create a simple, permissive policy for user_profiles SELECT
-- This allows users to see their own profile AND allows admins to see all profiles
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT USING (
  -- Always allow users to see their own profile
  auth.uid() = id 
  OR 
  -- Allow admins to see all profiles
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- Step 4: Create update policies
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_admin_update" ON public.user_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- Step 5: Fix policies for user_purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can view purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users and admins can view purchases" ON public.user_purchases;

CREATE POLICY "user_purchases_select_policy" ON public.user_purchases
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- Step 6: Fix policies for class_bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Users can view bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Users and admins can view bookings" ON public.class_bookings;

CREATE POLICY "class_bookings_select_policy" ON public.class_bookings
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- Step 7: Fix policies for class_schedules
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can view schedules" ON public.class_schedules;

CREATE POLICY "class_schedules_select_policy" ON public.class_schedules
FOR SELECT USING (
  -- All authenticated users can see non-cancelled classes
  (auth.role() = 'authenticated' AND is_cancelled = false)
  OR
  -- Admins can see all classes including cancelled ones
  EXISTS (
    SELECT 1 FROM public.user_profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.is_admin = true
  )
);

-- Step 8: Fix policies for class_packages (if needed for admin views)
DROP POLICY IF EXISTS "Authenticated users can view packages" ON public.class_packages;
DROP POLICY IF EXISTS "Users can view packages" ON public.class_packages;

CREATE POLICY "class_packages_select_policy" ON public.class_packages
FOR SELECT USING (auth.role() = 'authenticated');

-- Step 9: Verify your admin status is set correctly
-- Replace YOUR_USER_ID with your actual user ID
-- UPDATE public.user_profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';

-- Step 10: Test the policies work by running these queries
-- These should all return results if you're an admin:

-- Test 1: Can you see yourself?
SELECT 'Test 1 - Self visibility:', id, display_name, is_admin 
FROM public.user_profiles 
WHERE id = auth.uid();

-- Test 2: Can you see other users? (should work if you're admin)
SELECT 'Test 2 - Other users visibility:', COUNT(*) as user_count 
FROM public.user_profiles;

-- Test 3: Can you see purchases? (should work if you're admin)
SELECT 'Test 3 - Purchases visibility:', COUNT(*) as purchase_count 
FROM public.user_purchases;

-- Test 4: Can you see bookings? (should work if you're admin)
SELECT 'Test 4 - Bookings visibility:', COUNT(*) as booking_count 
FROM public.class_bookings;