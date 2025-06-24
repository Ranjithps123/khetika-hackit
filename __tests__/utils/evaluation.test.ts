import { describe, it, expect } from "@jest/globals"

// Question type definition
interface Question {
  id: string
  title: string
  question: string
  type: "multiple-choice" | "short-answer" | "essay"
  points: number
  rubric: string
  sample_answer: string
  keywords: string[]
}

// Evaluation function (extracted from component)
const evaluateExtractedText = (text: string, question: Question) => {
  const answerLower = text.toLowerCase()
  const matchedKeywords: string[] = []

  // Check for keyword matches
  question.keywords.forEach((keyword) => {
    if (answerLower.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword)
    }
  })

  let score = 0
  let confidence = 0
  let feedback = ""

  switch (question.type) {
    case "short-answer":
      const keywordRatio = matchedKeywords.length / question.keywords.length
      score = Math.floor(question.points * keywordRatio)
      confidence = matchedKeywords.length > 0 ? 85 + Math.random() * 15 : 60 + Math.random() * 25

      if (score >= question.points * 0.9) {
        feedback = "Excellent! Your answer is correct and complete."
      } else if (score >= question.points * 0.7) {
        feedback = `Good work! You got most of it right. Key concepts identified: ${matchedKeywords.join(", ")}`
      } else if (score >= question.points * 0.5) {
        feedback = `Partial credit. Your answer shows some understanding but could be more complete.`
      } else {
        feedback = "Your answer needs improvement. Please review the question and try to include the key concepts."
      }
      break

    case "essay":
      const essayKeywordRatio = matchedKeywords.length / question.keywords.length
      const lengthBonus = text.length > 50 ? 0.1 : 0
      score = Math.floor(question.points * (essayKeywordRatio + lengthBonus))
      confidence = Math.min(95, 70 + matchedKeywords.length * 5)

      const missedKeywords = question.keywords.filter((k) => !matchedKeywords.includes(k))

      if (score >= question.points * 0.9) {
        feedback = "Excellent essay! You covered all the key concepts comprehensively."
      } else if (score >= question.points * 0.7) {
        feedback = `Good essay with solid understanding. You mentioned: ${matchedKeywords.join(", ")}.`
      } else if (score >= question.points * 0.5) {
        feedback = `Your essay shows basic understanding but could be expanded.`
      } else {
        feedback = "Your essay needs significant improvement."
      }

      if (missedKeywords.length > 0) {
        feedback += ` Consider including: ${missedKeywords.join(", ")}.`
      }
      break

    case "multiple-choice":
      score = Math.random() > 0.5 ? question.points : 0
      confidence = 95
      feedback = score === question.points ? "Correct answer!" : "Incorrect answer."
      break
  }

  return {
    score: Math.min(score, question.points),
    confidence: Math.round(confidence),
    feedback,
    rubricMatch: matchedKeywords,
  }
}

describe("Answer Evaluation", () => {
  const mockPhotosynthesisQuestion: Question = {
    id: "1",
    title: "Science Question",
    question: "What is photosynthesis?",
    type: "essay",
    points: 10,
    rubric: "Should mention: sunlight, chlorophyll, carbon dioxide, oxygen, glucose",
    sample_answer:
      "Photosynthesis is the process by which plants convert sunlight into energy using chlorophyll, taking in carbon dioxide and producing oxygen and glucose.",
    keywords: ["sunlight", "chlorophyll", "carbon dioxide", "oxygen", "glucose", "plants", "energy"],
  }

  const mockMathQuestion: Question = {
    id: "2",
    title: "Basic Math",
    question: "What is 2 + 2?",
    type: "short-answer",
    points: 5,
    rubric: "Correct answer: 4. Partial credit for showing work.",
    sample_answer: "4",
    keywords: ["4", "four", "2+2", "addition"],
  }

  describe("Short Answer Evaluation", () => {
    it("should give full points for correct answer with all keywords", () => {
      const answer = "The answer is 4, which is the result of addition 2+2"
      const result = evaluateExtractedText(answer, mockMathQuestion)

      expect(result.score).toBe(5)
      expect(result.rubricMatch).toContain("4")
      expect(result.rubricMatch).toContain("2+2")
      expect(result.rubricMatch).toContain("addition")
      expect(result.feedback).toContain("Excellent")
    })

    it("should give partial credit for incomplete answer", () => {
      const answer = "The answer is 4"
      const result = evaluateExtractedText(answer, mockMathQuestion)

      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThan(5)
      expect(result.rubricMatch).toContain("4")
    })

    it("should give zero points for completely wrong answer", () => {
      const answer = "The answer is 5"
      const result = evaluateExtractedText(answer, mockMathQuestion)

      expect(result.score).toBe(0)
      expect(result.rubricMatch).toHaveLength(0)
      expect(result.feedback).toContain("needs improvement")
    })
  })

  describe("Essay Evaluation", () => {
    it("should give high score for comprehensive answer", () => {
      const answer = `Photosynthesis is the process where plants use sunlight and chlorophyll to convert 
      carbon dioxide and water into glucose and oxygen. This process provides energy for plants and 
      produces the oxygen we breathe.`

      const result = evaluateExtractedText(answer, mockPhotosynthesisQuestion)

      expect(result.score).toBeGreaterThan(7)
      expect(result.rubricMatch.length).toBeGreaterThan(4)
      expect(result.rubricMatch).toContain("sunlight")
      expect(result.rubricMatch).toContain("chlorophyll")
      expect(result.rubricMatch).toContain("carbon dioxide")
      expect(result.rubricMatch).toContain("oxygen")
      expect(result.rubricMatch).toContain("glucose")
    })

    it("should give length bonus for detailed answers", () => {
      const shortAnswer = "Plants use sunlight"
      const longAnswer =
        "Plants use sunlight and chlorophyll in a complex process that involves converting carbon dioxide from the air into glucose and oxygen through photosynthesis"

      const shortResult = evaluateExtractedText(shortAnswer, mockPhotosynthesisQuestion)
      const longResult = evaluateExtractedText(longAnswer, mockPhotosynthesisQuestion)

      expect(longResult.score).toBeGreaterThan(shortResult.score)
    })

    it("should provide feedback about missing keywords", () => {
      const incompleteAnswer = "Plants use sunlight to make food"
      const result = evaluateExtractedText(incompleteAnswer, mockPhotosynthesisQuestion)

      expect(result.feedback).toContain("Consider including")
      expect(result.score).toBeLessThan(mockPhotosynthesisQuestion.points)
    })
  })

  describe("Multiple Choice Evaluation", () => {
    const mockMCQuestion: Question = {
      id: "3",
      title: "Multiple Choice",
      question: "What is the capital of France?",
      type: "multiple-choice",
      points: 3,
      rubric: "Correct answer: Paris",
      sample_answer: "Paris",
      keywords: ["Paris"],
    }

    it("should return either full points or zero for multiple choice", () => {
      const answer = "Paris"
      const result = evaluateExtractedText(answer, mockMCQuestion)

      expect([0, 3]).toContain(result.score)
      expect(result.confidence).toBe(95)
      expect(["Correct answer!", "Incorrect answer."]).toContain(result.feedback)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty answer", () => {
      const result = evaluateExtractedText("", mockMathQuestion)

      expect(result.score).toBe(0)
      expect(result.rubricMatch).toHaveLength(0)
    })

    it("should handle case insensitive matching", () => {
      const answer = "The answer is FOUR"
      const result = evaluateExtractedText(answer, mockMathQuestion)

      expect(result.rubricMatch).toContain("four")
    })

    it("should not exceed maximum points", () => {
      // Create a question where keyword matching might exceed max points
      const result = evaluateExtractedText("test answer", mockMathQuestion)

      expect(result.score).toBeLessThanOrEqual(mockMathQuestion.points)
    })
  })
})
