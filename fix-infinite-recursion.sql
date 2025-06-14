-- FIX INFINITE RECURSION ERROR IN USER_PROFILES POLICIES
-- Run this in Supabase SQL Editor

-- First, drop ALL existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create a simple, non-recursive policy for viewing profiles
-- This avoids the infinite recursion by not checking user_profiles within itself
CREATE POLICY "Anyone can view any profile" ON public.user_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users update own profile only" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Now fix the other tables to use proper admin checks
-- For user_purchases
DROP POLICY IF EXISTS "Users and admins can view purchases" ON public.user_purchases;
CREATE POLICY "View purchases" ON public.user_purchases
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    )
  );

-- For class_bookings
DROP POLICY IF EXISTS "Users and admins can view bookings" ON public.class_bookings;
CREATE POLICY "View bookings" ON public.class_bookings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
    )
  );

-- For class_schedules
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.class_schedules;
CREATE POLICY "View schedules" ON public.class_schedules
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_cancelled = false
      OR
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
      )
    )
  );

-- Verify your admin status
SELECT id, display_name, is_admin FROM public.user_profiles WHERE id = auth.uid();