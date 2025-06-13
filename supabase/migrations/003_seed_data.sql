-- Insert default class packages
INSERT INTO public.class_packages (name, description, number_of_classes, price, validity_days) VALUES
  ('Single Class', 'Perfect for trying out our Pilates classes', 1, 350, 30),
  ('4 Class Pack', 'Our most popular package for regular practice', 4, 1200, 60),
  ('8 Class Pack', 'Commit to your practice with more savings', 8, 2000, 90),
  ('12 Class Pack', 'Best value for dedicated practitioners', 12, 2700, 120);

-- Insert sample class schedules for the next 30 days
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