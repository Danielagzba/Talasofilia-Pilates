-- Add welcomed column to user_profiles to track if welcome email has been sent
ALTER TABLE user_profiles
ADD COLUMN welcomed BOOLEAN DEFAULT FALSE;

-- Update existing users to be marked as welcomed to avoid sending emails to existing users
UPDATE user_profiles SET welcomed = TRUE WHERE welcomed IS NULL;