import { describe, it, expect, beforeEach, jest } from "@jest/globals"

// Mock file reader
const mockFileReader = {
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  readAsDataURL: jest.fn(),
  onload: null as any,
  onerror: null as any,
  result: null as any,
}

// Mock FileReader constructor
global.FileReader = jest.fn(() => mockFileReader) as any

// Text sanitization function (extracted from component)
const sanitizeText = (text: string): string => {
  if (!text) return ""

  try {
    let sanitized = text
      .replace(/\0/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/\\u[0-9a-fA-F]{4}/g, " ")
      .replace(/\\x[0-9a-fA-F]{2}/g, " ")
      .replace(/\\[0-7]{1,3}/g, " ")
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\")
      .replace(/\s+/g, " ")
      .trim()

    sanitized = sanitized.normalize("NFKC")

    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + "... [truncated]"
    }

    return sanitized
  } catch (error) {
    return "Error processing extracted text"
  }
}

// Text extraction function (extracted from component)
const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileType = file.type

    if (fileType === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const sanitizedText = sanitizeText(text || "")
        resolve(sanitizedText)
      }
      reader.onerror = () => reject(new Error("Failed to read text file"))
      reader.readAsText(file)
    } else if (fileType === "application/pdf") {
      resolve(`Photosynthesis is the process by which green plants, algae, and some bacteria use sunlight to
produce food. During this process, they convert carbon dioxide from the air and water from the soil
into glucose (a type of sugar) and oxygen, using sunlight as the energy source.`)
    } else if (fileType.startsWith("image/")) {
      resolve(
        `This is text extracted from the image "${file.name}". In a real implementation, this would contain the actual text recognized from the image using OCR technology.`,
      )
    } else {
      reject(new Error("Unsupported file type"))
    }
  })
}

describe("Text Extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("sanitizeText", () => {
    it("should return empty string for null/undefined input", () => {
      expect(sanitizeText("")).toBe("")
      expect(sanitizeText(null as any)).toBe("")
      expect(sanitizeText(undefined as any)).toBe("")
    })

    it("should remove control characters", () => {
      const input = "Hello\x00World\x01Test"
      const result = sanitizeText(input)
      expect(result).toBe("HelloWorldTest")
    })

    it("should replace escape sequences with spaces", () => {
      const input = "Hello\\nWorld\\rTest\\tMore"
      const result = sanitizeText(input)
      expect(result).toBe("Hello World Test More")
    })

    it("should normalize excessive whitespace", () => {
      const input = "Hello    World     Test"
      const result = sanitizeText(input)
      expect(result).toBe("Hello World Test")
    })

    it("should truncate long text", () => {
      const longText = "a".repeat(15000)
      const result = sanitizeText(longText)
      expect(result.length).toBeLessThanOrEqual(10020) // 10000 + "... [truncated]"
      expect(result.endsWith("... [truncated]")).toBe(true)
    })

    it("should handle Unicode normalization", () => {
      const input = "café" // Contains combining characters
      const result = sanitizeText(input)
      expect(result).toBe("café")
    })
  })

  describe("extractTextFromFile", () => {
    it("should extract text from plain text files", async () => {
      const mockFile = new File(["Hello World"], "test.txt", { type: "text/plain" })

      // Mock FileReader behavior
      mockFileReader.onload = null
      mockFileReader.readAsText.mockImplementation(() => {
        mockFileReader.result = "Hello World"
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: "Hello World" } } as any)
        }
      })

      const result = await extractTextFromFile(mockFile)
      expect(result).toBe("Hello World")
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)
    })

    it("should handle PDF files", async () => {
      const mockFile = new File(["fake pdf content"], "test.pdf", { type: "application/pdf" })

      const result = await extractTextFromFile(mockFile)
      expect(result).toContain("Photosynthesis")
      expect(result).toContain("carbon dioxide")
      expect(result).toContain("chlorophyll")
    })

    it("should handle image files", async () => {
      const mockFile = new File(["fake image"], "test.jpg", { type: "image/jpeg" })

      const result = await extractTextFromFile(mockFile)
      expect(result).toContain("text extracted from the image")
      expect(result).toContain("test.jpg")
    })

    it("should reject unsupported file types", async () => {
      const mockFile = new File(["content"], "test.unknown", { type: "application/unknown" })

      await expect(extractTextFromFile(mockFile)).rejects.toThrow("Unsupported file type")
    })

    it("should handle file reading errors", async () => {
      const mockFile = new File(["content"], "test.txt", { type: "text/plain" })

      mockFileReader.readAsText.mockImplementation(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error("Read error"))
        }
      })

      await expect(extractTextFromFile(mockFile)).rejects.toThrow("Failed to read text file")
    })
  })
})
