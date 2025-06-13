-- Check if the trigger exists and recreate it
DROP TRIGGER IF EXISTS decrement_classes_trigger ON public.class_bookings;
DROP FUNCTION IF EXISTS decrement_classes_on_booking();

-- Recreate the function to decrement classes on booking
CREATE OR REPLACE FUNCTION decrement_classes_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new booking is confirmed, decrement classes_remaining
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    UPDATE public.user_purchases 
    SET classes_remaining = classes_remaining - 1 
    WHERE id = NEW.purchase_id AND classes_remaining > 0;
    
    -- Also update the class schedule booking count
    UPDATE public.class_schedules 
    SET current_bookings = current_bookings + 1 
    WHERE id = NEW.schedule_id;
    
  -- When booking is updated from non-confirmed to confirmed
  ELSIF TG_OP = 'UPDATE' AND OLD.booking_status != 'confirmed' AND NEW.booking_status = 'confirmed' THEN
    UPDATE public.user_purchases 
    SET classes_remaining = classes_remaining - 1 
    WHERE id = NEW.purchase_id AND classes_remaining > 0;
    
    UPDATE public.class_schedules 
    SET current_bookings = current_bookings + 1 
    WHERE id = NEW.schedule_id;
    
  -- When booking is cancelled, return the class credit
  ELSIF TG_OP = 'UPDATE' AND OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    UPDATE public.user_purchases 
    SET classes_remaining = classes_remaining + 1 
    WHERE id = NEW.purchase_id;
    
    UPDATE public.class_schedules 
    SET current_bookings = current_bookings - 1 
    WHERE id = NEW.schedule_id AND current_bookings > 0;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER decrement_classes_trigger
AFTER INSERT OR UPDATE ON public.class_bookings
FOR EACH ROW EXECUTE FUNCTION decrement_classes_on_booking();

-- Test the trigger by checking current data
SELECT 
  cb.id as booking_id,
  cb.booking_status,
  up.classes_remaining,
  up.total_classes,
  cs.class_name,
  cs.current_bookings,
  cs.max_capacity
FROM class_bookings cb
JOIN user_purchases up ON cb.purchase_id = up.id
JOIN class_schedules cs ON cb.schedule_id = cs.id
ORDER BY cb.created_at DESC
LIMIT 5;