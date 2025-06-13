-- Check current RLS policies on user_purchases
SELECT * FROM pg_policies WHERE tablename = 'user_purchases';

-- Create a policy that allows the service role to insert purchases
CREATE POLICY "Service role can insert purchases" ON public.user_purchases
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Alternative: Create a policy that allows inserts when all required fields are present
CREATE POLICY "Allow webhook purchase inserts" ON public.user_purchases
  FOR INSERT 
  WITH CHECK (
    user_id IS NOT NULL AND 
    package_id IS NOT NULL AND 
    payment_status = 'completed' AND
    stripe_payment_intent_id IS NOT NULL
  );

-- If you want to allow anonymous inserts for webhooks (less secure but simpler)
-- CREATE POLICY "Allow anonymous purchase inserts" ON public.user_purchases
--   FOR INSERT 
--   TO anon
--   WITH CHECK (
--     payment_status = 'completed' AND
--     stripe_payment_intent_id IS NOT NULL
--   );