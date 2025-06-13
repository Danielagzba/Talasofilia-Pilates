-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Class Packages Policies
-- Anyone can view active class packages (even non-authenticated users for pricing page)
CREATE POLICY "Anyone can view active packages" ON public.class_packages
  FOR SELECT USING (is_active = true);

-- User Purchases Policies
-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.user_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert own purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Class Schedules Policies
-- Anyone authenticated can view non-cancelled class schedules
CREATE POLICY "Authenticated users can view schedules" ON public.class_schedules
  FOR SELECT USING (auth.role() = 'authenticated' AND is_cancelled = false);

-- Class Bookings Policies
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.class_bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookings
CREATE POLICY "Users can insert own bookings" ON public.class_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellation)
CREATE POLICY "Users can update own bookings" ON public.class_bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();