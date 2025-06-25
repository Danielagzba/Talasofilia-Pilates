-- Migration from Stripe to Mercado Pago
-- This migration adds Mercado Pago fields while keeping Stripe fields for backward compatibility

-- Step 1: Add Mercado Pago specific columns to user_purchases table
ALTER TABLE public.user_purchases
ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_preference_id TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_status TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_status_detail TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'mercado_pago'));

-- Step 2: Create index for Mercado Pago payment IDs
CREATE INDEX IF NOT EXISTS idx_user_purchases_mp_payment_id ON public.user_purchases(mercado_pago_payment_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_mp_preference_id ON public.user_purchases(mercado_pago_preference_id);

-- Step 3: Add comment to explain the new fields
COMMENT ON COLUMN public.user_purchases.mercado_pago_payment_id IS 'Mercado Pago payment ID from the payment notification';
COMMENT ON COLUMN public.user_purchases.mercado_pago_preference_id IS 'Mercado Pago preference ID used to create the payment';
COMMENT ON COLUMN public.user_purchases.mercado_pago_status IS 'Mercado Pago payment status (approved, pending, in_process, rejected)';
COMMENT ON COLUMN public.user_purchases.mercado_pago_status_detail IS 'Detailed status information from Mercado Pago';
COMMENT ON COLUMN public.user_purchases.payment_provider IS 'Payment provider used for this purchase (stripe or mercado_pago)';

-- Step 4: Update existing records to mark them as Stripe payments
UPDATE public.user_purchases
SET payment_provider = 'stripe'
WHERE stripe_payment_intent_id IS NOT NULL AND payment_provider IS NULL;