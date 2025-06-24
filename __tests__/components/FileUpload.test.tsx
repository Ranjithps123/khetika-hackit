import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FileUpload } from "@/components/file-upload"

// Mock the dependencies
jest.mock("@/lib/supabase", () => ({
  fetchQuestions: jest.fn(),
  createEvaluation: jest.fn(),
}))

jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock react-dropzone
jest.mock("react-dropzone", () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: () => ({ "data-testid": "dropzone" }),
    getInputProps: () => ({ "data-testid": "file-input" }),
    isDragActive: false,
  })),
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
    keywords: ["sunlight", "chlorophyll", "carbon dioxide"],
  },
  {
    id: "2",
    title: "Math Question",
    question: "What is 2 + 2?",
    type: "short-answer" as const,
    points: 5,
    rubric: "Correct answer is 4",
    sample_answer: "4",
    keywords: ["4", "four"],
  },
]

describe("FileUpload Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { fetchQuestions } = require("@/lib/supabase")
    fetchQuestions.mockResolvedValue(mockQuestions)
  })

  it("should render file upload interface", async () => {
    render(<FileUpload />)

    await waitFor(() => {
      expect(screen.getByText("Upload answer sheets")).toBeInTheDocument()
      expect(screen.getByText("Choose Files")).toBeInTheDocument()
      expect(screen.getByLabelText("Student Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Select Question")).toBeInTheDocument()
    })
  })

  it("should load questions on mount", async () => {
    const { fetchQuestions } = require("@/lib/supabase")
    render(<FileUpload />)

    await waitFor(() => {
      expect(fetchQuestions).toHaveBeenCalled()
    })
  })

  it("should update student name input", async () => {
    render(<FileUpload />)

    const nameInput = await screen.findByLabelText("Student Name")
    fireEvent.change(nameInput, { target: { value: "John Doe" } })

    expect(nameInput).toHaveValue("John Doe")
  })

  it("should show file type badges", async () => {
    render(<FileUpload />)

    await waitFor(() => {
      expect(screen.getByText("PDF")).toBeInTheDocument()
      expect(screen.getByText("Images")).toBeInTheDocument()
      expect(screen.getByText("Text")).toBeInTheDocument()
    })
  })

  it("should display drag and drop instructions", async () => {
    render(<FileUpload />)

    await waitFor(() => {
      expect(screen.getByText("Drag and drop files here, or click to select files")).toBeInTheDocument()
    })
  })
})
