-- Fix RLS policies for MercadoPago webhooks
-- First, drop the existing webhook policy if it exists
DROP POLICY IF EXISTS "Allow webhook purchase inserts" ON public.user_purchases;

-- Create a new policy that supports both Stripe and MercadoPago webhooks
CREATE POLICY "Allow webhook purchase inserts" ON public.user_purchases
  FOR INSERT 
  WITH CHECK (
    user_id IS NOT NULL AND 
    package_id IS NOT NULL AND 
    payment_status = 'completed' AND
    payment_provider IS NOT NULL AND
    (
      -- Stripe payments must have stripe_payment_intent_id
      (payment_provider = 'stripe' AND stripe_payment_intent_id IS NOT NULL) OR
      -- MercadoPago payments must have mercado_pago_payment_id
      (payment_provider = 'mercado_pago' AND mercado_pago_payment_id IS NOT NULL)
    )
  );

-- Ensure service role can always insert (for webhooks using service key)
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.user_purchases;
CREATE POLICY "Service role can insert purchases" ON public.user_purchases
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Also ensure service role can update purchases (for webhook updates)
DROP POLICY IF EXISTS "Service role can update purchases" ON public.user_purchases;
CREATE POLICY "Service role can update purchases" ON public.user_purchases
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);