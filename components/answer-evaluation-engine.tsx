"use client"

export interface EvaluationResult {
  fileId: string
  studentName: string
  questionId: string
  questionTitle: string
  extractedAnswer: string
  score: number
  maxPoints: number
  confidence: number
  feedback: string
  rubricMatch: string[]
  timestamp: Date
}

export interface Question {
  id: string
  title: string
  question: string
  type: "multiple-choice" | "short-answer" | "essay"
  points: number
  rubric: string
  sampleAnswer: string
  keywords: string[]
}

export class AnswerEvaluationEngine {
  private questions: Question[] = [
    {
      id: "1",
      title: "Basic Math",
      question: "What is 2 + 2?",
      type: "short-answer",
      points: 5,
      rubric: "Correct answer: 4. Partial credit for showing work.",
      sampleAnswer: "4",
      keywords: ["4", "four", "2+2", "addition"],
    },
    {
      id: "2",
      title: "Science Question",
      question: "What is photosynthesis?",
      type: "essay",
      points: 10,
      rubric: "Should mention: sunlight, chlorophyll, carbon dioxide, oxygen, glucose",
      sampleAnswer:
        "Photosynthesis is the process by which plants convert sunlight into energy using chlorophyll, taking in carbon dioxide and producing oxygen and glucose.",
      keywords: ["sunlight", "chlorophyll", "carbon dioxide", "oxygen", "glucose", "plants", "energy"],
    },
  ]

  evaluateAnswer(extractedText: string, questionId: string, studentName = "Anonymous"): EvaluationResult {
    const question = this.questions.find((q) => q.id === questionId)
    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`)
    }

    const evaluation = this.performEvaluation(extractedText, question)

    return {
      fileId: Math.random().toString(36).substr(2, 9),
      studentName,
      questionId: question.id,
      questionTitle: question.title,
      extractedAnswer: extractedText,
      score: evaluation.score,
      maxPoints: question.points,
      confidence: evaluation.confidence,
      feedback: evaluation.feedback,
      rubricMatch: evaluation.rubricMatch,
      timestamp: new Date(),
    }
  }

  private performEvaluation(
    answer: string,
    question: Question,
  ): {
    score: number
    confidence: number
    feedback: string
    rubricMatch: string[]
  } {
    const answerLower = answer.toLowerCase()
    const matchedKeywords: string[] = []

    // Check for keyword matches
    question.keywords.forEach((keyword) => {
      if (answerLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword)
      }
    })

    // Calculate score based on keyword matches and question type
    let score = 0
    let confidence = 0
    let feedback = ""

    switch (question.type) {
      case "short-answer":
        score = this.evaluateShortAnswer(answerLower, question, matchedKeywords)
        confidence = matchedKeywords.length > 0 ? 85 + Math.random() * 15 : 60 + Math.random() * 25
        feedback = this.generateShortAnswerFeedback(score, question.points, matchedKeywords)
        break

      case "essay":
        score = this.evaluateEssay(answerLower, question, matchedKeywords)
        confidence = Math.min(95, 70 + matchedKeywords.length * 5)
        feedback = this.generateEssayFeedback(score, question.points, matchedKeywords, question.keywords)
        break

      case "multiple-choice":
        score = this.evaluateMultipleChoice(answerLower, question)
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

  private evaluateShortAnswer(answer: string, question: Question, matchedKeywords: string[]): number {
    if (question.id === "1") {
      // Math question
      if (answer.includes("4") || answer.includes("four")) {
        return question.points
      } else if (answer.includes("2") && answer.includes("+")) {
        return Math.floor(question.points * 0.5) // Partial credit for showing work
      }
      return 0
    }

    // General short answer evaluation
    const keywordRatio = matchedKeywords.length / question.keywords.length
    return Math.floor(question.points * keywordRatio)
  }

  private evaluateEssay(answer: string, question: Question, matchedKeywords: string[]): number {
    const keywordRatio = matchedKeywords.length / question.keywords.length
    const lengthBonus = answer.length > 50 ? 0.1 : 0 // Bonus for detailed answers

    return Math.floor(question.points * (keywordRatio + lengthBonus))
  }

  private evaluateMultipleChoice(answer: string, question: Question): number {
    // This would check against the correct answer
    return Math.random() > 0.5 ? question.points : 0
  }

  private generateShortAnswerFeedback(score: number, maxPoints: number, matchedKeywords: string[]): string {
    const percentage = (score / maxPoints) * 100

    if (percentage >= 90) {
      return "Excellent! Your answer is correct and complete."
    } else if (percentage >= 70) {
      return `Good work! You got most of it right. Key concepts identified: ${matchedKeywords.join(", ")}`
    } else if (percentage >= 50) {
      return `Partial credit. Your answer shows some understanding but could be more complete.`
    } else {
      return "Your answer needs improvement. Please review the question and try to include the key concepts."
    }
  }

  private generateEssayFeedback(
    score: number,
    maxPoints: number,
    matchedKeywords: string[],
    allKeywords: string[],
  ): string {
    const percentage = (score / maxPoints) * 100
    const missedKeywords = allKeywords.filter((k) => !matchedKeywords.includes(k))

    let feedback = ""

    if (percentage >= 90) {
      feedback = "Excellent essay! You covered all the key concepts comprehensively."
    } else if (percentage >= 70) {
      feedback = `Good essay with solid understanding. You mentioned: ${matchedKeywords.join(", ")}.`
    } else if (percentage >= 50) {
      feedback = `Your essay shows basic understanding but could be expanded.`
    } else {
      feedback = "Your essay needs significant improvement."
    }

    if (missedKeywords.length > 0) {
      feedback += ` Consider including: ${missedKeywords.join(", ")}.`
    }

    return feedback
  }

  getQuestions(): Question[] {
    return this.questions
  }

  addQuestion(question: Omit<Question, "id">): Question {
    const newQuestion: Question = {
      ...question,
      id: Date.now().toString(),
    }
    this.questions.push(newQuestion)
    return newQuestion
  }
}

export const evaluationEngine = new AnswerEvaluationEngine()
