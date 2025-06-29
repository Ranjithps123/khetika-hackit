import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { question, expectedAnswer, studentAnswer } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `
You are an expert educational evaluator. Please evaluate the student's answer against the expected answer.

Question: ${question}
Expected Answer: ${expectedAnswer}
Student Answer: ${studentAnswer}

Please provide a comprehensive evaluation with the following criteria:
1. Accuracy and completeness of the answer
2. Understanding of key concepts
3. Clarity and coherence of explanation
4. Use of relevant terminology

Respond in the following JSON format:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "confidence": number (0-100),
  "feedback": "detailed feedback explaining the evaluation"
}

The score should reflect how well the student answered the question, and confidence should indicate how certain you are about your evaluation.
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational evaluator. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const evaluationText = data.choices[0]?.message?.content

    if (!evaluationText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response from OpenAI
    let evaluation
    try {
      evaluation = JSON.parse(evaluationText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', evaluationText)
      throw new Error('Invalid response format from OpenAI')
    }

    // Validate the response structure
    if (typeof evaluation.isCorrect !== 'boolean' || 
        typeof evaluation.score !== 'number' || 
        typeof evaluation.confidence !== 'number' || 
        typeof evaluation.feedback !== 'string') {
      throw new Error('Invalid evaluation response structure')
    }

    return NextResponse.json(evaluation)

  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { 
        error: 'Evaluation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 