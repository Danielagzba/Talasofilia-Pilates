-- Disable the automatic trigger for class bookings
-- We'll handle decrements manually in the application code

-- Drop the existing trigger
DROP TRIGGER IF EXISTS decrement_classes_trigger ON public.class_bookings;

-- Keep the function for potential future use but it won't be triggered automatically
-- DROP FUNCTION IF EXISTS decrement_classes_on_booking();

-- Add a comment to document this change
COMMENT ON TABLE public.class_bookings IS 'Booking decrements are handled by the application code, not database triggers';