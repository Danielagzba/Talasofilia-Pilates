-- Fix corrupted settings data by properly storing values as JSONB
-- This script will clean up any multiple-stringified values

-- Update string values that have been multiple-stringified
UPDATE public.settings
SET value = 
  CASE 
    WHEN key IN ('studio_name', 'contact_email', 'phone_number') THEN
      -- Extract the actual string value from multiple-stringified data
      CASE
        WHEN value::text LIKE '"%' THEN
          -- Remove outer quotes and parse as JSON repeatedly until we get the actual value
          (SELECT 
            CASE 
              WHEN jsonb_typeof(value) = 'string' THEN
                -- Keep unwrapping until we get to the actual string
                (WITH RECURSIVE unwrap AS (
                  SELECT value as val, 0 as depth
                  UNION ALL
                  SELECT 
                    CASE 
                      WHEN jsonb_typeof(val) = 'string' THEN val::jsonb
                      ELSE val
                    END,
                    depth + 1
                  FROM unwrap
                  WHERE jsonb_typeof(val) = 'string' AND depth < 10
                )
                SELECT val FROM unwrap ORDER BY depth DESC LIMIT 1)
              ELSE value
            END
          )
        ELSE 
          -- If it's not stringified, just ensure it's proper JSON
          to_jsonb(value::text)
      END
    WHEN key IN ('default_class_capacity', 'booking_window_hours', 'cancellation_window_hours') THEN
      -- Convert to number
      to_jsonb(COALESCE(NULLIF(regexp_replace(value::text, '[^0-9]', '', 'g'), '')::integer, 
        CASE key 
          WHEN 'default_class_capacity' THEN 10
          WHEN 'booking_window_hours' THEN 3
          WHEN 'cancellation_window_hours' THEN 24
        END
      ))
    WHEN key IN ('notification_new_booking', 'notification_cancellation', 'notification_low_capacity') THEN
      -- Convert to boolean
      to_jsonb(value::text ILIKE '%true%')
    ELSE value
  END
WHERE key IN (
  'studio_name', 'contact_email', 'phone_number',
  'default_class_capacity', 'booking_window_hours', 'cancellation_window_hours',
  'notification_new_booking', 'notification_cancellation', 'notification_low_capacity'
);

-- Set default values for any missing settings
INSERT INTO public.settings (key, value, description) VALUES
  ('booking_window_hours', '3'::jsonb, 'Number of hours before class when bookings close'),
  ('cancellation_window_hours', '24'::jsonb, 'Number of hours before class when cancellations are no longer allowed'),
  ('default_class_capacity', '10'::jsonb, 'Default capacity for new classes'),
  ('studio_name', '"Talasofilia Pilates"'::jsonb, 'Name of the studio'),
  ('contact_email', '""'::jsonb, 'Contact email for the studio'),
  ('phone_number', '""'::jsonb, 'Phone number for the studio'),
  ('notification_new_booking', 'true'::jsonb, 'Receive notifications for new bookings'),
  ('notification_cancellation', 'true'::jsonb, 'Receive notifications for cancellations'),
  ('notification_low_capacity', 'true'::jsonb, 'Receive alerts when classes are almost full')
ON CONFLICT (key) DO NOTHING;