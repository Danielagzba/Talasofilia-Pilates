-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create a function to check if the current user is admin
-- This avoids the recursion by using a direct query
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT is_admin INTO is_admin_user
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now recreate the admin policies using the function
-- For user_profiles, we need to allow users to see their own profile OR if they're admin
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

CREATE POLICY "Users can view profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.is_admin()
  );

-- Update other admin policies to use the function
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_purchases;
CREATE POLICY "Users can view purchases" ON public.user_purchases
  FOR SELECT USING (
    auth.uid() = user_id OR auth.is_admin()
  );

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.class_bookings;
CREATE POLICY "Users can view bookings" ON public.class_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR auth.is_admin()
  );

-- Update class schedules policy
DROP POLICY IF EXISTS "Users can view schedules" ON public.class_schedules;
CREATE POLICY "Users can view schedules" ON public.class_schedules
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_cancelled = false OR auth.is_admin()
    )
  );

-- Update other admin policies
DROP POLICY IF EXISTS "Admins can insert schedules" ON public.class_schedules;
CREATE POLICY "Admins can insert schedules" ON public.class_schedules
  FOR INSERT WITH CHECK (auth.is_admin());

DROP POLICY IF EXISTS "Admins can update schedules" ON public.class_schedules;
CREATE POLICY "Admins can update schedules" ON public.class_schedules
  FOR UPDATE USING (auth.is_admin());

DROP POLICY IF EXISTS "Admins can delete schedules" ON public.class_schedules;
CREATE POLICY "Admins can delete schedules" ON public.class_schedules
  FOR DELETE USING (auth.is_admin());

DROP POLICY IF EXISTS "Admins can insert packages" ON public.class_packages;
CREATE POLICY "Admins can insert packages" ON public.class_packages
  FOR INSERT WITH CHECK (auth.is_admin());

DROP POLICY IF EXISTS "Admins can update packages" ON public.class_packages;
CREATE POLICY "Admins can update packages" ON public.class_packages
  FOR UPDATE USING (auth.is_admin());

DROP POLICY IF EXISTS "Admins can delete packages" ON public.class_packages;
CREATE POLICY "Admins can delete packages" ON public.class_packages
  FOR DELETE USING (auth.is_admin());

DROP POLICY IF EXISTS "Admins can update all bookings" ON public.class_bookings;
CREATE POLICY "Admins can update bookings" ON public.class_bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR auth.is_admin()
  );