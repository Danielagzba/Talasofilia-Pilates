-- Fix for display_name not being set on account creation
-- This updates the handle_new_user trigger to use email as fallback for display_name

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Update the function to use email as fallback for display_name
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

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Update existing users who have NULL display_name
UPDATE public.user_profiles
SET display_name = SPLIT_PART(auth.users.email, '@', 1)
FROM auth.users
WHERE user_profiles.id = auth.users.id
  AND user_profiles.display_name IS NULL;

-- Step 5: Add a comment explaining the behavior
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user profile when a new auth user is created. Uses email username as display_name if not provided in metadata.';