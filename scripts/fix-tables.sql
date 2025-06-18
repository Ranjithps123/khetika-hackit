-- Drop existing tables if they exist to recreate with correct structure
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- Create questions table with correct structure
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('multiple-choice', 'short-answer', 'essay')),
  points INTEGER NOT NULL DEFAULT 0,
  rubric TEXT,
  sample_answer TEXT,
  keywords TEXT[], -- Array of keywords for evaluation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table with correct structure
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  extracted_answer TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_points INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  rubric_match TEXT[], -- Array of matched keywords
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample questions
INSERT INTO questions (title, question, type, points, rubric, sample_answer, keywords) VALUES
('Basic Math', 'What is 2 + 2?', 'short-answer', 5, 'Correct answer: 4. Partial credit for showing work.', '4', ARRAY['4', 'four', '2+2', 'addition']),
('Science Question', 'What is photosynthesis?', 'essay', 10, 'Should mention: sunlight, chlorophyll, carbon dioxide, oxygen, glucose', 'Photosynthesis is the process by which plants convert sunlight into energy using chlorophyll, taking in carbon dioxide and producing oxygen and glucose.', ARRAY['sunlight', 'chlorophyll', 'carbon dioxide', 'oxygen', 'glucose', 'plants', 'energy']),
('History Question', 'Who was the first president of the United States?', 'short-answer', 3, 'Correct answer: George Washington', 'George Washington', ARRAY['George Washington', 'Washington']);
