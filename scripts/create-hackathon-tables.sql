-- Drop existing tables if they exist to recreate with correct structure
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

-- Create themes table
CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🚀',
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  prize_pool INTEGER NOT NULL DEFAULT 0,
  max_teams INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table with proper foreign key
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  team_members TEXT,
  project_title VARCHAR(255) NOT NULL,
  project_description TEXT,
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  application_url TEXT,
  gitlab_url TEXT,
  pdf_file_name VARCHAR(255),
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  feedback TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'winner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO themes (title, description, icon, difficulty, prize_pool, max_teams) VALUES
('Logistics Optimization', 'Route optimization for last-mile delivery to farmers/retailers', '🚚', 'hard', 100000, 20),
('Inventory Management', 'Predictive inventory planning at Khetika warehouses', '📦', 'medium', 75000, 25),
('Supply Chain Transparency', 'Blockchain-based traceability of produce', '🔍', 'hard', 100000, 15),
('Demand & Price Forecasting', 'ML models to forecast demand based on season, region, weather', '📈', 'hard', 125000, 20),
('Farmer Support Tools', 'Order tracking + WhatsApp bot for updates', '🛠️', 'medium', 50000, 30),
('Admin Insights Dashboard', 'Unified dashboard with real-time order, delivery, and issue heatmaps', '📊', 'medium', 75000, 25);

-- Insert sample submissions for testing
INSERT INTO submissions (team_name, team_members, project_title, project_description, theme_id, application_url, gitlab_url, score, status) 
SELECT 
  'Team Alpha',
  'John Doe, Jane Smith, Alex Johnson',
  'Smart Route Optimizer',
  'AI-powered route optimization system for last-mile delivery using machine learning algorithms to reduce delivery time and costs.',
  themes.id,
  'https://smart-route-optimizer.vercel.app',
  'https://gitlab.com/team-alpha/route-optimizer',
  85,
  'reviewed'
FROM themes WHERE title = 'Logistics Optimization';

INSERT INTO submissions (team_name, team_members, project_title, project_description, theme_id, application_url, gitlab_url, score, status) 
SELECT 
  'Team Beta',
  'Sarah Wilson, Mike Chen, Lisa Brown',
  'Inventory Prophet',
  'Predictive inventory management system using weather data, seasonal patterns, and historical sales to optimize warehouse stock levels.',
  themes.id,
  'https://inventory-prophet.vercel.app',
  'https://gitlab.com/team-beta/inventory-prophet',
  92,
  'winner'
FROM themes WHERE title = 'Inventory Management';

INSERT INTO submissions (team_name, team_members, project_title, project_description, theme_id, application_url, gitlab_url, score, status) 
SELECT 
  'Team Gamma',
  'David Kumar, Emma Davis, Ryan Patel',
  'FarmTrace Blockchain',
  'Blockchain-based supply chain transparency platform that tracks produce from farm to consumer with QR code scanning.',
  themes.id,
  'https://farmtrace-blockchain.vercel.app',
  'https://gitlab.com/team-gamma/farmtrace',
  78,
  'reviewed'
FROM themes WHERE title = 'Supply Chain Transparency';
