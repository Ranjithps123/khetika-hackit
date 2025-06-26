-- Enable Row Level Security
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update submissions table to include user_id
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for themes (readable by all authenticated users)
CREATE POLICY "Themes are viewable by authenticated users" ON themes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Themes are manageable by admins" ON themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

-- Create RLS policies for submissions
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Users can create their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage all submissions" ON submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

-- Insert admin user (you'll need to update this with actual admin user ID after signup)
-- This is a placeholder - replace with actual admin user ID
-- INSERT INTO user_profiles (id, email, full_name, user_type) 
-- VALUES ('your-admin-user-id-here', 'admin@khetika.com', 'Admin User', 'admin');

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, user_type)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
