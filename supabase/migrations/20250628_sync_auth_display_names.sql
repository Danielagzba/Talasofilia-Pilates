-- Create a function to sync display names from auth.users to user_profiles
CREATE OR REPLACE FUNCTION public.sync_user_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user_profiles table when auth.users metadata changes
  UPDATE user_profiles
  SET display_name = COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    display_name,
    SPLIT_PART(NEW.email, '@', 1)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync on auth.users updates
DROP TRIGGER IF EXISTS sync_user_display_name_on_update ON auth.users;
CREATE TRIGGER sync_user_display_name_on_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
    OR OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.sync_user_display_name();

-- Update existing user profiles with auth display names
UPDATE user_profiles p
SET display_name = COALESCE(
  NULLIF(u.raw_user_meta_data->>'display_name', ''),
  NULLIF(u.raw_user_meta_data->>'full_name', ''),
  NULLIF(u.raw_user_meta_data->>'name', ''),
  p.display_name,
  SPLIT_PART(u.email, '@', 1)
)
FROM auth.users u
WHERE p.id = u.id;

-- Update the handle_new_user function to better handle display names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;