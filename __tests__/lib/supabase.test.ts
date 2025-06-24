import { describe, it, expect, beforeEach, jest } from "@jest/globals"

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [{ id: "1", title: "Test" }],
        error: null,
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          data: [{ id: "1", title: "Updated" }],
          error: null,
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        error: null,
      })),
    })),
  })),
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabase),
}))

// Import functions after mocking
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion, createEvaluation } from "@/lib/supabase"

describe("Supabase Database Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchQuestions", () => {
    it("should fetch questions successfully", async () => {
      const mockData = [{ id: "1", title: "Test Question", question: "What is test?", type: "short-answer", points: 5 }]

      mockSupabase.from().select().order.mockReturnValue({
        data: mockData,
        error: null,
      })

      const result = await fetchQuestions()

      expect(mockSupabase.from).toHaveBeenCalledWith("questions")
      expect(result).toEqual(mockData)
    })

    it("should handle fetch errors", async () => {
      mockSupabase
        .from()
        .select()
        .order.mockReturnValue({
          data: null,
          error: { message: "Database error" },
        })

      const result = await fetchQuestions()

      expect(result).toEqual([])
    })
  })

  describe("createQuestion", () => {
    it("should create question successfully", async () => {
      const newQuestion = {
        title: "New Question",
        question: "What is new?",
        type: "short-answer" as const,
        points: 5,
        rubric: "Test rubric",
        sample_answer: "Test answer",
        keywords: ["test"],
      }

      const mockResponse = { id: "1", ...newQuestion }
      mockSupabase
        .from()
        .insert()
        .select.mockReturnValue({
          data: [mockResponse],
          error: null,
        })

      const result = await createQuestion(newQuestion)

      expect(mockSupabase.from).toHaveBeenCalledWith("questions")
      expect(result).toEqual(mockResponse)
    })

    it("should handle creation errors", async () => {
      const newQuestion = {
        title: "New Question",
        question: "What is new?",
        type: "short-answer" as const,
        points: 5,
        rubric: "Test rubric",
        sample_answer: "Test answer",
        keywords: ["test"],
      }

      mockSupabase
        .from()
        .insert()
        .select.mockReturnValue({
          data: null,
          error: { message: "Creation failed" },
        })

      const result = await createQuestion(newQuestion)

      expect(result).toBeNull()
    })
  })

  describe("updateQuestion", () => {
    it("should update question successfully", async () => {
      const updates = { title: "Updated Title" }
      const mockResponse = { id: "1", title: "Updated Title" }

      mockSupabase
        .from()
        .update()
        .eq()
        .select.mockReturnValue({
          data: [mockResponse],
          error: null,
        })

      const result = await updateQuestion("1", updates)

      expect(result).toEqual(mockResponse)
    })
  })

  describe("deleteQuestion", () => {
    it("should delete question successfully", async () => {
      mockSupabase.from().delete().eq.mockReturnValue({
        error: null,
      })

      const result = await deleteQuestion("1")

      expect(result).toBe(true)
    })

    it("should handle deletion errors", async () => {
      mockSupabase
        .from()
        .delete()
        .eq.mockReturnValue({
          error: { message: "Deletion failed" },
        })

      const result = await deleteQuestion("1")

      expect(result).toBe(false)
    })
  })

  describe("createEvaluation", () => {
    it("should create evaluation successfully", async () => {
      const newEvaluation = {
        file_id: "file1",
        student_name: "John Doe",
        question_id: "q1",
        extracted_answer: "Test answer",
        score: 8,
        max_points: 10,
        confidence: 85,
        feedback: "Good work",
        rubric_match: ["keyword1"],
      }

      const mockResponse = { id: "1", ...newEvaluation }
      mockSupabase
        .from()
        .insert()
        .select.mockReturnValue({
          data: [mockResponse],
          error: null,
        })

      const result = await createEvaluation(newEvaluation)

      expect(mockSupabase.from).toHaveBeenCalledWith("evaluations")
      expect(result).toEqual(mockResponse)
    })
  })
})
