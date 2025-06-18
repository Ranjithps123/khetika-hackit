"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, File, FileText, X, CheckCircle, ImageIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchQuestions, createEvaluation, type Question } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  extractedText?: string
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true)
      try {
        const questions = await fetchQuestions()
        setQuestions(questions)
        if (questions.length > 0) {
          setSelectedQuestionId(questions[0].id)
        }
      } catch (error) {
        console.error("Failed to load questions:", error)
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!selectedQuestionId) {
        toast({
          title: "No question selected",
          description: "Please select a question before uploading files.",
          variant: "destructive",
        })
        return
      }

      const newFiles = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading" as const,
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...newFiles])

      // Simulate file processing
      newFiles.forEach((file) => {
        simulateFileProcessing(file.id)
      })
    },
    [studentName, selectedQuestionId],
  )

  const simulateFileProcessing = (fileId: string) => {
    const updateProgress = (progress: number, status: UploadedFile["status"]) => {
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress, status } : f)))
    }

    // Simulate upload progress
    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        clearInterval(uploadInterval)
        updateProgress(100, "processing")

        // Simulate text extraction
        setTimeout(() => {
          updateProgress(100, "completed")
          const extractedText = "Sample extracted text from the uploaded file..."

          // Trigger evaluation after text extraction
          evaluateAnswer(fileId, extractedText)

          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, extractedText } : f)))
        }, 2000)
      } else {
        updateProgress(progress, "uploading")
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    multiple: true,
  })

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type === "application/pdf") return <File className="h-4 w-4" />
    if (type === "text/plain") return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getStatusColor = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "bg-blue-500"
      case "processing":
        return "bg-yellow-500"
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const evaluateAnswer = async (fileId: string, extractedText: string) => {
    try {
      if (!selectedQuestionId) {
        toast({
          title: "Error",
          description: "No question selected for evaluation",
          variant: "destructive",
        })
        return
      }

      const question = questions.find((q) => q.id === selectedQuestionId)
      if (!question) {
        toast({
          title: "Error",
          description: "Selected question not found",
          variant: "destructive",
        })
        return
      }

      // Perform evaluation logic
      const evaluationResult = evaluateExtractedText(extractedText, question)

      // Save to Supabase
      const result = await createEvaluation({
        file_id: fileId,
        student_name: studentName || "Anonymous Student",
        question_id: selectedQuestionId,
        extracted_answer: extractedText,
        score: evaluationResult.score,
        max_points: question.points,
        confidence: evaluationResult.confidence,
        feedback: evaluationResult.feedback,
        rubric_match: evaluationResult.rubricMatch,
        status: "pending",
      })

      if (result) {
        toast({
          title: "Evaluation Complete",
          description: `Score: ${evaluationResult.score}/${question.points}`,
        })
      }
    } catch (error) {
      console.error("Evaluation failed:", error)
      toast({
        title: "Evaluation Failed",
        description: "There was an error evaluating the answer",
        variant: "destructive",
      })
    }
  }

  const evaluateExtractedText = (text: string, question: Question) => {
    const answerLower = text.toLowerCase()
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
        const lengthBonus = text.length > 50 ? 0.1 : 0 // Bonus for detailed answers
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="student-name">Student Name</Label>
          <Input
            id="student-name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student name"
          />
        </div>
        <div>
          <Label htmlFor="question-select">Select Question</Label>
          <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading questions..." : "Choose a question"} />
            </SelectTrigger>
            <SelectContent>
              {questions.map((question) => (
                <SelectItem key={question.id} value={question.id}>
                  {question.title} ({question.points} pts)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? "Drop files here" : "Upload answer sheets"}
        </p>
        <p className="text-sm text-gray-500 mb-4">Drag and drop files here, or click to select files</p>
        <div className="flex justify-center gap-2 mb-4">
          <Badge variant="secondary">PDF</Badge>
          <Badge variant="secondary">Images</Badge>
          <Badge variant="secondary">Text</Badge>
        </div>
        <Button variant="outline">Choose Files</Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Uploaded Files</h3>
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${getStatusColor(file.status)} text-white`}>
                        {file.status}
                      </Badge>
                      {file.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {file.status !== "completed" && (
                  <div className="mt-3">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}

                {file.extractedText && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-1">Extracted Text:</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{file.extractedText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
