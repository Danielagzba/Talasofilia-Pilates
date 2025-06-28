-- Sync display names from auth.users to user_profiles
-- This will update user_profiles with the display names from auth metadata

-- First, let's check what display names exist in auth.users
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'display_name' as auth_display_name,
  p.display_name as profile_display_name
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'display_name' IS NOT NULL;

-- Update user_profiles with display names from auth.users where available
UPDATE user_profiles p
SET display_name = u.raw_user_meta_data->>'display_name'
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'display_name' IS NOT NULL
  AND (p.display_name IS NULL OR p.display_name = '' OR p.display_name = SPLIT_PART(u.email, '@', 1));

-- For users without auth display name, ensure they at least have email username
UPDATE user_profiles p
SET display_name = SPLIT_PART(u.email, '@', 1)
FROM auth.users u
WHERE p.id = u.id
  AND (p.display_name IS NULL OR p.display_name = '')
  AND (u.raw_user_meta_data->>'display_name' IS NULL OR u.raw_user_meta_data->>'display_name' = '');

-- Update the trigger to properly sync display names for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- Use display_name from metadata if available, otherwise use email username
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the update
SELECT 
  p.id,
  p.display_name,
  u.email,
  u.raw_user_meta_data->>'display_name' as auth_display_name
FROM user_profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;