-- Fix existing users with NULL or empty display names
-- This will update them to use their email username as display name

-- First, let's check how many users have NULL or empty display names
SELECT COUNT(*) as users_without_display_name
FROM user_profiles
WHERE display_name IS NULL OR display_name = '';

-- Update user_profiles to use email username where display_name is missing
UPDATE user_profiles
SET display_name = (
  SELECT SPLIT_PART(email, '@', 1)
  FROM auth.users
  WHERE auth.users.id = user_profiles.id
)
WHERE display_name IS NULL OR display_name = '';

-- Verify the update
SELECT id, display_name, created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Also ensure the trigger exists to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- Use display_name from metadata if available, otherwise use email username
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();