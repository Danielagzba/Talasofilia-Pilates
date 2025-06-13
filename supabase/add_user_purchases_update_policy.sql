-- Add missing UPDATE policy for user_purchases table
-- This allows users to update their own purchases (needed for decrementing classes_remaining)

CREATE POLICY "Users can update own purchases" ON public.user_purchases
  FOR UPDATE USING (auth.uid() = user_id);

-- Also add a policy for service role to update class_schedules current_bookings
CREATE POLICY "Authenticated users can update class schedules bookings" ON public.class_schedules
  FOR UPDATE USING (auth.role() = 'authenticated');