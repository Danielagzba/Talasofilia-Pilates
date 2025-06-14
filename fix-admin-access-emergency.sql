-- EMERGENCY FIX: Restore admin access and fix policies
-- Run this in Supabase SQL Editor

-- First, drop the problematic policy that was just created
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Drop the old policy that might be blocking access
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;

-- Create a proper policy that allows:
-- 1. Users to see their own profile
-- 2. Admins to see ALL profiles
CREATE POLICY "Users and admins can view profiles" ON public.user_profiles
  FOR SELECT USING (
    -- User can see their own profile
    auth.uid() = id 
    OR 
    -- OR user is an admin (check if current user has is_admin = true)
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Ensure the user can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ensure the admin can update any profile
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fix policies for user_purchases to allow admins to see all
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can view purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_purchases;

CREATE POLICY "Users and admins can view purchases" ON public.user_purchases
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fix policies for class_bookings to allow admins to see all
DROP POLICY IF EXISTS "Users can view own bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Users can view bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.class_bookings;

CREATE POLICY "Users and admins can view bookings" ON public.class_bookings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fix policies for class_schedules
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can view schedules" ON public.class_schedules;

CREATE POLICY "Authenticated users can view schedules" ON public.class_schedules
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Non-admins can only see non-cancelled classes
      (is_cancelled = false)
      OR
      -- Admins can see all classes including cancelled ones
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = true
      )
    )
  );

-- IMPORTANT: After running this, check your admin status with this query:
-- SELECT id, display_name, is_admin FROM public.user_profiles WHERE id = auth.uid();

-- If you need to make yourself admin again, uncomment and run this:
-- UPDATE public.user_profiles SET is_admin = true WHERE id = 'YOUR_USER_ID_HERE';