-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create class_packages table (available packages for purchase)
CREATE TABLE public.class_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  number_of_classes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  validity_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_purchases table (purchased packages)
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.class_packages(id),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  classes_remaining INTEGER NOT NULL,
  total_classes INTEGER NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create class_schedules table (available class times)
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  current_bookings INTEGER DEFAULT 0,
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create class_bookings table (user bookings)
CREATE TABLE public.class_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.class_schedules(id),
  purchase_id UUID NOT NULL REFERENCES public.user_purchases(id),
  booking_status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, attended, no-show
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  attended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX idx_user_purchases_status ON public.user_purchases(payment_status);
CREATE INDEX idx_class_schedules_date ON public.class_schedules(class_date);
CREATE INDEX idx_class_bookings_user_id ON public.class_bookings(user_id);
CREATE INDEX idx_class_bookings_schedule_id ON public.class_bookings(schedule_id);
CREATE INDEX idx_class_bookings_status ON public.class_bookings(booking_status);

-- Create trigger to update current_bookings count
CREATE OR REPLACE FUNCTION update_class_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    UPDATE public.class_schedules 
    SET current_bookings = current_bookings + 1 
    WHERE id = NEW.schedule_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status != 'confirmed' THEN
      UPDATE public.class_schedules 
      SET current_bookings = current_bookings - 1 
      WHERE id = NEW.schedule_id;
    ELSIF OLD.booking_status != 'confirmed' AND NEW.booking_status = 'confirmed' THEN
      UPDATE public.class_schedules 
      SET current_bookings = current_bookings + 1 
      WHERE id = NEW.schedule_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.booking_status = 'confirmed' THEN
    UPDATE public.class_schedules 
    SET current_bookings = current_bookings - 1 
    WHERE id = OLD.schedule_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_count
AFTER INSERT OR UPDATE OR DELETE ON public.class_bookings
FOR EACH ROW EXECUTE FUNCTION update_class_booking_count();

-- Create trigger to decrement classes_remaining after booking
CREATE OR REPLACE FUNCTION decrement_classes_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    UPDATE public.user_purchases 
    SET classes_remaining = classes_remaining - 1 
    WHERE id = NEW.purchase_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_status != 'confirmed' AND NEW.booking_status = 'confirmed' THEN
      UPDATE public.user_purchases 
      SET classes_remaining = classes_remaining - 1 
      WHERE id = NEW.purchase_id;
    ELSIF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
      UPDATE public.user_purchases 
      SET classes_remaining = classes_remaining + 1 
      WHERE id = NEW.purchase_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_classes_trigger
AFTER INSERT OR UPDATE ON public.class_bookings
FOR EACH ROW EXECUTE FUNCTION decrement_classes_on_booking();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_packages_updated_at BEFORE UPDATE ON public.class_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON public.class_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();