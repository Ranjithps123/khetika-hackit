-- Make a specific user an admin
-- This script helps you promote any existing user to admin status

-- Step 1: Find your user ID
-- Look for your email in the auth.users table
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email ILIKE '%your-email%'  -- Replace with part of your email
ORDER BY created_at DESC;

-- Step 2: Check if user profile exists
-- SELECT * FROM user_profiles WHERE id = 'your-user-id-here';

-- Step 3: Create or update user profile to admin
-- Replace 'your-user-id-here' with the actual UUID from Step 1
/*
INSERT INTO user_profiles (id, email, full_name, user_type) 
VALUES (
  'your-user-id-here'::uuid,  -- Replace with your actual user ID
  'your-email@example.com',   -- Replace with your actual email
  'Your Full Name',           -- Replace with your actual name
  'admin'
) ON CONFLICT (id) DO UPDATE SET 
  user_type = 'admin',
  updated_at = NOW();
*/

-- Step 4: Verify the admin user was created
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.user_type,
    au.email as auth_email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE up.user_type = 'admin'
ORDER BY up.created_at DESC;

-- Example: If your user ID is abc123..., uncomment and run:
-- UPDATE user_profiles SET user_type = 'admin' WHERE id = 'abc123...'::uuid;
