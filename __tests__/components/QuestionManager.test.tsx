import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import QuestionManager from "@/components/question-manager"

// Mock the dependencies
jest.mock("@/lib/supabase", () => ({
  fetchQuestions: jest.fn(),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
}))

jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

const mockQuestions = [
  {
    id: "1",
    title: "Science Question",
    question: "What is photosynthesis?",
    type: "essay" as const,
    points: 10,
    rubric: "Should mention key concepts",
    sample_answer: "Sample answer",
    keywords: ["sunlight", "chlorophyll"],
  },
]

describe("QuestionManager Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { fetchQuestions } = require("@/lib/supabase")
    fetchQuestions.mockResolvedValue(mockQuestions)
  })

  it("should render question manager interface", async () => {
    render(<QuestionManager />)

    await waitFor(() => {
      expect(screen.getByText("Questions (1)")).toBeInTheDocument()
      expect(screen.getByText("Add Question")).toBeInTheDocument()
    })
  })

  it("should display existing questions", async () => {
    render(<QuestionManager />)

    await waitFor(() => {
      expect(screen.getByText("Science Question")).toBeInTheDocument()
      expect(screen.getByText("What is photosynthesis?")).toBeInTheDocument()
      expect(screen.getByText("10 pts")).toBeInTheDocument()
    })
  })

  it("should open create question form when Add Question is clicked", async () => {
    render(<QuestionManager />)

    await waitFor(() => {
      const addButton = screen.getByText("Add Question")
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByText("Create New Question")).toBeInTheDocument()
      expect(screen.getByLabelText("Question Title")).toBeInTheDocument()
      expect(screen.getByLabelText("Question Text")).toBeInTheDocument()
    })
  })

  it("should validate required fields when saving", async () => {
    const { toast } = require("@/hooks/use-toast")
    render(<QuestionManager />)

    // Open create form
    await waitFor(() => {
      const addButton = screen.getByText("Add Question")
      fireEvent.click(addButton)
    })

    // Try to save without filling required fields
    await waitFor(() => {
      const saveButton = screen.getByText("Save Question")
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
    })
  })

  it("should create new question with valid data", async () => {
    const { createQuestion } = require("@/lib/supabase")
    createQuestion.mockResolvedValue({ id: "2", title: "New Question" })

    render(<QuestionManager />)

    // Open create form
    await waitFor(() => {
      const addButton = screen.getByText("Add Question")
      fireEvent.click(addButton)
    })

    // Fill in form
    await waitFor(() => {
      const titleInput = screen.getByLabelText("Question Title")
      const questionInput = screen.getByLabelText("Question Text")

      fireEvent.change(titleInput, { target: { value: "New Question" } })
      fireEvent.change(questionInput, { target: { value: "What is the answer?" } })
    })

    // Save question
    await waitFor(() => {
      const saveButton = screen.getByText("Save Question")
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(createQuestion).toHaveBeenCalled()
    })
  })
})
