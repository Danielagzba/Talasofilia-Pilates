-- Delete all existing class schedules
DELETE FROM public.class_schedules;

-- Reset the booking counts (since we deleted all schedules)
-- This ensures we start fresh

-- Insert new class schedules for the next 30 days
-- This creates recurring classes Monday to Saturday at 8:30 AM and 9:30 AM
DO $$
DECLARE
  start_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  curr_date DATE;
BEGIN
  curr_date := start_date;
  
  WHILE curr_date <= end_date LOOP
    -- Skip Sundays (0 = Sunday)
    IF EXTRACT(DOW FROM curr_date) != 0 THEN
      -- First class at 8:30 AM
      INSERT INTO public.class_schedules (
        class_name, 
        instructor_name, 
        class_date, 
        start_time, 
        end_time, 
        max_capacity
      ) VALUES (
        'Morning Flow', 
        'Maria Rodriguez', 
        curr_date, 
        '08:30:00', 
        '09:30:00', 
        3
      );
      
      -- Second class at 9:30 AM
      INSERT INTO public.class_schedules (
        class_name, 
        instructor_name, 
        class_date, 
        start_time, 
        end_time, 
        max_capacity
      ) VALUES (
        'Core Strength', 
        'Ana Martinez', 
        curr_date, 
        '09:30:00', 
        '10:30:00', 
        3
      );
    END IF;
    
    curr_date := curr_date + INTERVAL '1 day';
  END LOOP;
END $$;