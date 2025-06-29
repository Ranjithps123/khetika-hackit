# Evaluation System

A sophisticated answer evaluation system that uses OpenAI for intelligent assessment of student responses.

## Features

- PDF text extraction and preview
- Image OCR simulation
- OpenAI-powered answer evaluation
- Real-time scoring and feedback
- Database storage of evaluations

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration (if using database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. OpenAI API Key

To get your OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

### 4. Run the Application

```bash
npm run dev
```

## How It Works

### Answer Evaluation

The system uses OpenAI's GPT-3.5-turbo model to evaluate student answers with:

- **Accuracy Assessment**: Evaluates how well the answer addresses the question
- **Concept Understanding**: Checks for proper understanding of key concepts
- **Clarity Analysis**: Assesses the clarity and coherence of explanations
- **Terminology Usage**: Evaluates appropriate use of subject-specific terms

### Evaluation Criteria

1. **Score (0-100)**: Overall quality of the answer
2. **Confidence (0-100)**: How certain the AI is about the evaluation
3. **Feedback**: Detailed explanation of strengths and areas for improvement
4. **Correctness**: Boolean indicating if the answer is fundamentally correct

### Fallback System

If OpenAI API is unavailable, the system falls back to keyword matching for basic evaluation.

## API Endpoints

### POST /api/evaluate-answer

Evaluates a student answer using OpenAI.

**Request Body:**
```json
{
  "question": "What is photosynthesis?",
  "expectedAnswer": "Process by which plants convert sunlight into energy",
  "studentAnswer": "Photosynthesis is when plants make food from sunlight"
}
```

**Response:**
```json
{
  "isCorrect": true,
  "score": 85,
  "confidence": 92,
  "feedback": "Excellent understanding of photosynthesis..."
}
```

## Components

- `FileUpload`: Main component for file upload and processing
- `AnswerEvaluationEngine`: Standalone evaluation component
- PDF text extraction with visual preview
- Image OCR simulation
- Database integration for storing evaluations
