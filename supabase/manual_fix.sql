-- Manual fix for the booking system

-- 1. Reset all current_bookings to actual count
UPDATE class_schedules 
SET current_bookings = (
  SELECT COUNT(*) 
  FROM class_bookings cb 
  WHERE cb.schedule_id = class_schedules.id 
  AND cb.booking_status = 'confirmed'
);

-- 2. Update user purchases to reflect actual bookings
UPDATE user_purchases 
SET classes_remaining = total_classes - (
  SELECT COUNT(*) 
  FROM class_bookings cb 
  WHERE cb.purchase_id = user_purchases.id 
  AND cb.booking_status = 'confirmed'
)
WHERE payment_status = 'completed';

-- 3. Check the results
SELECT 
  'FIXED_DATA' as section,
  up.id as purchase_id,
  up.classes_remaining,
  up.total_classes,
  (SELECT COUNT(*) FROM class_bookings cb WHERE cb.purchase_id = up.id AND cb.booking_status = 'confirmed') as actual_bookings
FROM user_purchases up
WHERE payment_status = 'completed';