-- Check what's happening with your bookings
-- Replace 'YOUR_USER_ID' with your actual user ID

-- 1. First, let's see your user ID and purchases
SELECT 
  'USER INFO' as table_name,
  u.id as user_id,
  u.email,
  up.id as purchase_id,
  up.classes_remaining,
  up.total_classes,
  up.payment_status
FROM auth.users u
LEFT JOIN user_purchases up ON u.id = up.user_id
ORDER BY u.created_at DESC;

-- 2. Check all bookings
SELECT 
  'BOOKINGS' as table_name,
  cb.id as booking_id,
  cb.user_id,
  cb.purchase_id,
  cb.schedule_id,
  cb.booking_status,
  cb.created_at
FROM class_bookings cb
ORDER BY cb.created_at DESC;

-- 3. Check if trigger fired - look at class schedules
SELECT 
  'CLASS SCHEDULES' as table_name,
  cs.id,
  cs.class_name,
  cs.class_date,
  cs.start_time,
  cs.current_bookings,
  cs.max_capacity
FROM class_schedules cs
WHERE cs.class_date >= CURRENT_DATE
ORDER BY cs.class_date, cs.start_time;