-- Clean up any duplicate user profiles and ensure proper constraints
-- First, let's see if there are any duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT id, COUNT(*) as cnt
        FROM user_profiles
        GROUP BY id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate user profiles, cleaning up...', duplicate_count;
        
        -- Delete duplicates, keeping only the most recent one
        DELETE FROM user_profiles
        WHERE ctid NOT IN (
            SELECT DISTINCT ON (id) ctid
            FROM user_profiles
            ORDER BY id, created_at DESC
        );
        
        RAISE NOTICE 'Cleaned up duplicate user profiles';
    ELSE
        RAISE NOTICE 'No duplicate user profiles found';
    END IF;
END $$;

-- Ensure the table has proper constraints
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

-- Update the trigger function to handle conflicts better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to safely get or create user profile
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_id UUID, user_email TEXT, user_full_name TEXT DEFAULT '')
RETURNS user_profiles AS $$
DECLARE
    profile user_profiles;
BEGIN
    -- Try to get existing profile
    SELECT * INTO profile FROM user_profiles WHERE id = user_id;
    
    -- If not found, create one
    IF NOT FOUND THEN
        INSERT INTO user_profiles (id, email, full_name, user_type)
        VALUES (user_id, user_email, user_full_name, 'user')
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
            updated_at = NOW()
        RETURNING * INTO profile;
    END IF;
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
