-- Update themes with the new hackathon themes
DELETE FROM themes;

INSERT INTO themes (title, description, icon, difficulty, prize_pool, max_teams) VALUES
('Logistics Optimization', 'Route optimization and delivery efficiency solutions', '🚚', 'hard', 100000, 20),
('Inventory Management', 'Smart inventory planning and management systems', '📦', 'medium', 75000, 25),
('Traceability of Products', 'Track products through the entire supply chain', '🔍', 'medium', 80000, 20),
('Smart Invoice & Document Extraction', 'AI-powered document processing and extraction', '🧾', 'hard', 90000, 15),
('Supply Chain Transparency', 'End-to-end visibility and transparency solutions', '🔍', 'hard', 100000, 15),
('Demand & Price Forecasting', 'Predictive analytics for demand planning and pricing', '📈', 'hard', 125000, 20),
('Admin Insights Dashboard', 'Real-time analytics and reporting dashboards', '📊', 'medium', 75000, 25);
