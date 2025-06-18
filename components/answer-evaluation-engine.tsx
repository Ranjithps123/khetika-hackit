import type React from "react"

interface Question {
  question_text: string
  expected_answer: string
  student_answer: string
}

interface EvaluationResult {
  isCorrect: boolean
  feedback: string
}

const evaluateAnswer = (question: Question): EvaluationResult => {
  if (!question.expected_answer || !question.question_text) {
    return {
      isCorrect: false,
      feedback: "Expected answer or question text is missing.",
    }
  }

  const expectedAnswer = question.expected_answer.toLowerCase()
  const questionText = question.question_text.toLowerCase()
  const studentAnswer = question.student_answer.toLowerCase()

  // Simple keyword matching for demonstration purposes
  const expectedKeywords = expectedAnswer.split(" ")
  let correctKeywordCount = 0

  for (const keyword of expectedKeywords) {
    if (studentAnswer.includes(keyword)) {
      correctKeywordCount++
    }
  }

  const isCorrect = correctKeywordCount >= expectedKeywords.length / 2 // Adjust threshold as needed

  let feedback = ""
  if (isCorrect) {
    feedback = "Correct!"
  } else {
    feedback = `Incorrect. The expected answer contains keywords: ${expectedKeywords.join(", ")}.`
  }

  return {
    isCorrect,
    feedback,
  }
}

interface AnswerEvaluationEngineProps {
  question: Question
}

const AnswerEvaluationEngine: React.FC<AnswerEvaluationEngineProps> = ({ question }) => {
  const evaluationResult = evaluateAnswer(question)

  return (
    <div>
      <p>Question: {question.question_text}</p>
      <p>Your Answer: {question.student_answer}</p>
      <p>Expected Answer: {question.expected_answer}</p>
      <p>Evaluation: {evaluationResult.isCorrect ? "Correct" : "Incorrect"}</p>
      <p>Feedback: {evaluationResult.feedback}</p>
    </div>
  )
}

export default AnswerEvaluationEngine
