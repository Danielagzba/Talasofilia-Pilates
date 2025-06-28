-- Create settings table to store application configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view settings" ON public.settings
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE is_admin = true
    )
  );

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON public.settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE is_admin = true
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON public.settings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE is_admin = true
    )
  );

-- Service role has full access (for initial setup and migrations)
CREATE POLICY "Service role has full access to settings" ON public.settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('booking_window_hours', '3', 'Number of hours before class when bookings close'),
  ('cancellation_window_hours', '24', 'Number of hours before class when cancellations are no longer allowed'),
  ('default_class_capacity', '10', 'Default capacity for new classes'),
  ('studio_name', '"Talasofilia Pilates"', 'Name of the studio'),
  ('contact_email', 'null', 'Contact email for the studio'),
  ('phone_number', 'null', 'Phone number for the studio'),
  ('notification_new_booking', 'true', 'Receive notifications for new bookings'),
  ('notification_cancellation', 'true', 'Receive notifications for cancellations'),
  ('notification_low_capacity', 'true', 'Receive alerts when classes are almost full')
ON CONFLICT (key) DO NOTHING;