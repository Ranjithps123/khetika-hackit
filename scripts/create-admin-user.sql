-- Create an admin user profile
-- Replace the UUID with your actual user ID after signing up

-- First, check if there are any existing users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Check existing user profiles
SELECT * FROM user_profiles ORDER BY created_at DESC;

-- Method 1: Update existing user to admin (replace with your user ID)
-- UPDATE user_profiles 
-- SET user_type = 'admin' 
-- WHERE email = 'your-email@example.com';

-- Method 2: Insert admin profile if it doesn't exist (replace with your user ID)
-- INSERT INTO user_profiles (id, email, full_name, user_type) 
-- VALUES (
--   'your-user-id-here'::uuid, 
--   'admin@khetika.com', 
--   'Admin User', 
--   'admin'
-- ) ON CONFLICT (id) DO UPDATE SET user_type = 'admin';

-- Method 3: Create a demo admin user (for testing)
INSERT INTO user_profiles (id, email, full_name, user_type) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'admin@demo.com', 
  'Demo Admin', 
  'admin'
) ON CONFLICT (id) DO UPDATE SET user_type = 'admin';

-- Show all user profiles to verify
SELECT id, email, full_name, user_type, created_at FROM user_profiles ORDER BY created_at DESC;
