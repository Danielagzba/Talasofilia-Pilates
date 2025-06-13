-- Debug script to check what's happening with bookings

-- 1. Check your current purchases
SELECT 
  id,
  classes_remaining,
  total_classes,
  payment_status,
  created_at
FROM user_purchases 
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC;

-- 2. Check your bookings
SELECT 
  id,
  booking_status,
  purchase_id,
  schedule_id,
  created_at
FROM class_bookings 
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC;

-- 3. Check class schedules current bookings
SELECT 
  id,
  class_name,
  class_date,
  start_time,
  current_bookings,
  max_capacity
FROM class_schedules 
WHERE current_bookings > 0
ORDER BY class_date, start_time;