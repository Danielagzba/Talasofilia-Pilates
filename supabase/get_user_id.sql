-- Find all users in your database
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;