import type React from "react"
import { useState } from "react"

interface Question {
  question_text: string
  expected_answer: string
  student_answer: string
}

interface EvaluationResult {
  isCorrect: boolean
  feedback: string
  score: number
  confidence: number
}

const evaluateAnswerWithOpenAI = async (question: Question): Promise<EvaluationResult> => {
  try {
    const response = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.question_text,
        expectedAnswer: question.expected_answer,
        studentAnswer: question.student_answer,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to evaluate answer')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Evaluation error:', error)
    return {
      isCorrect: false,
      feedback: "Evaluation failed. Please try again.",
      score: 0,
      confidence: 0,
    }
  }
}

interface AnswerEvaluationEngineProps {
  question: Question
}

const AnswerEvaluationEngine: React.FC<AnswerEvaluationEngineProps> = ({ question }) => {
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const handleEvaluate = async () => {
    setIsEvaluating(true)
    try {
      const result = await evaluateAnswerWithOpenAI(question)
      setEvaluationResult(result)
    } catch (error) {
      console.error('Evaluation failed:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold text-lg">Question:</h3>
        <p className="text-gray-700">{question.question_text}</p>
      </div>
      
      <div>
        <h3 className="font-semibold">Your Answer:</h3>
        <p className="text-gray-700">{question.student_answer}</p>
      </div>
      
      <div>
        <h3 className="font-semibold">Expected Answer:</h3>
        <p className="text-gray-700">{question.expected_answer}</p>
      </div>
      
      <button
        onClick={handleEvaluate}
        disabled={isEvaluating}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isEvaluating ? 'Evaluating...' : 'Evaluate Answer'}
      </button>
      
      {evaluationResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Evaluation Results:</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Score:</span> {evaluationResult.score}/100
            </p>
            <p>
              <span className="font-medium">Confidence:</span> {evaluationResult.confidence}%
            </p>
            <p>
              <span className="font-medium">Result:</span> 
              <span className={evaluationResult.isCorrect ? 'text-green-600' : 'text-red-600'}>
                {evaluationResult.isCorrect ? ' Correct' : ' Incorrect'}
              </span>
            </p>
            <p>
              <span className="font-medium">Feedback:</span> {evaluationResult.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnswerEvaluationEngine
