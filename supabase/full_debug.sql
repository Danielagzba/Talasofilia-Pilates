-- Complete debug - run all three parts

-- 1. User and purchase info
SELECT 
  'USER_PURCHASES' as section,
  u.id as user_id,
  u.email,
  up.id as purchase_id,
  up.classes_remaining,
  up.total_classes,
  up.payment_status,
  up.created_at
FROM auth.users u
LEFT JOIN user_purchases up ON u.id = up.user_id
ORDER BY u.created_at DESC;

-- 2. All bookings
SELECT 
  'BOOKINGS' as section,
  cb.id as booking_id,
  cb.user_id,
  cb.purchase_id,
  cb.schedule_id,
  cb.booking_status,
  cb.created_at
FROM class_bookings cb
ORDER BY cb.created_at DESC;

-- 3. Reset any negative booking counts and check
UPDATE class_schedules 
SET current_bookings = 0 
WHERE current_bookings < 0;

-- 4. Show updated class schedules
SELECT 
  'UPDATED_SCHEDULES' as section,
  cs.id,
  cs.class_name,
  cs.class_date,
  cs.start_time,
  cs.current_bookings,
  cs.max_capacity
FROM class_schedules cs
WHERE cs.class_date >= CURRENT_DATE
ORDER BY cs.class_date, cs.start_time;