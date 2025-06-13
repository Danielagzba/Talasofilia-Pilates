-- Add a test purchase for a user to test the booking system
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users table

-- First, find your user ID by running:
-- SELECT id, email FROM auth.users;

-- Then run this to add a test 4-class package:
INSERT INTO public.user_purchases (
  user_id,
  package_id,
  purchase_date,
  expiry_date,
  classes_remaining,
  total_classes,
  amount_paid,
  payment_method,
  payment_status
) VALUES (
  'USER_ID_HERE', -- Replace with your actual user ID
  (SELECT id FROM public.class_packages WHERE name = '4 Class Pack' LIMIT 1),
  NOW(),
  NOW() + INTERVAL '60 days',
  4, -- 4 classes available
  4, -- 4 total classes
  1200.00,
  'manual_test',
  'completed'
);

-- To check if it worked:
-- SELECT * FROM public.user_purchases WHERE user_id = 'USER_ID_HERE';