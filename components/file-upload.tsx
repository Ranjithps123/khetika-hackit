"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
  file: File
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!selectedFile) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        
        // Set worker source dynamically
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
      } catch (error) {
        console.error('Error rendering PDF:', error);
        toast({
          title: "PDF Preview Error",
          description: "Could not render PDF preview",
          variant: "destructive"
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile]);

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

  const sanitizeText = (text: string): string => {
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
      console.error("Error sanitizing text:", error)
      return "Error processing extracted text"
    }
  }

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // Dynamically import PDF.js to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
      
      // Set worker source dynamically
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = content.items.map((item: any) => item.str)
        fullText += strings.join(' ') + '\n\n'
      }
      return fullText.trim()
    } catch (error: any) {
      console.error("PDF parsing error:", error)
      throw new Error("PDF processing failed")
    }
  }

  const extractTextFromImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        setTimeout(() => {
          const simulatedOCRText = `Simulated OCR text from ${file.name}`
          resolve(simulatedOCRText)
        }, 2000)
      }
      img.onerror = () => resolve("Error processing image")
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "text/plain") {
      const reader = new FileReader()
      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const text = e.target?.result as string
          resolve(sanitizeText(text || ""))
        }
        reader.onerror = () => reject("Failed to read text file")
        reader.readAsText(file)
      })
    } else if (file.type === "application/pdf") {
      const reader = new FileReader()
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer
            const text = await extractTextFromPDF(buffer)
            resolve(sanitizeText(text))
          } catch (e) {
            reject(e)
          }
        }
        reader.onerror = () => reject("Failed to read PDF")
        reader.readAsArrayBuffer(file)
      })
    } else if (file.type.startsWith("image/")) {
      const text = await extractTextFromImage(file)
      return sanitizeText(text)
    } else {
      throw new Error("Unsupported file type")
    }
  }

  const evaluateExtractedText = async (text: string, question: Question) => {
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.title,
          expectedAnswer: question.keywords.join(', '), // Using keywords as expected concepts
          studentAnswer: text,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate answer')
      }

      const result = await response.json()
      
      return {
        score: result.score,
        confidence: result.confidence,
        feedback: result.feedback,
        rubricMatch: question.keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()))
      }
    } catch (error) {
      console.error('OpenAI evaluation failed, falling back to keyword matching:', error)
      
      // Fallback to keyword matching if OpenAI fails
      const lower = text.toLowerCase()
      const matched = question.keywords.filter(k => lower.includes(k.toLowerCase()))
      const ratio = matched.length / question.keywords.length
      const score = Math.floor(question.points * ratio)
      
      return {
        score,
        confidence: 80 + matched.length * 3,
        feedback: matched.length > 0 ? "Good start!" : "Needs improvement",
        rubricMatch: matched
      }
    }
  }

  const processFile = async (fileId: string, file: File) => {
    const updateProgress = (progress: number, status: UploadedFile["status"]) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress, status } : f))
    }
    try {
      updateProgress(25, "uploading")
      await new Promise(r => setTimeout(r, 300))
      updateProgress(50, "processing")

      if (file.type === "application/pdf") {
        setSelectedFile(file)
      }

      const text = await extractTextFromFile(file)
      updateProgress(75, "processing")
      await new Promise(r => setTimeout(r, 300))
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, extractedText: text, progress: 100, status: "completed" } : f))
      await evaluateAnswer(fileId, text)
    } catch (e: any) {
      console.error("Error:", e)
      updateProgress(0, "error")
      toast({ title: "Error", description: e.message || "Unknown error", variant: "destructive" })
    }
  }

  const evaluateAnswer = async (fileId: string, text: string) => {
    const question = questions.find(q => q.id === selectedQuestionId)
    if (!question) return
    const evaluation = await evaluateExtractedText(text, question)
    await createEvaluation({
      file_id: fileId,
      student_name: sanitizeText(studentName || "Anonymous"),
      question_id: selectedQuestionId,
      extracted_answer: sanitizeText(text),
      score: evaluation.score,
      max_points: question.points,
      confidence: evaluation.confidence,
      feedback: sanitizeText(evaluation.feedback),
      rubric_match: evaluation.rubricMatch.map(sanitizeText),
      status: "pending",
    })
    toast({ title: "Evaluated", description: `Score: ${evaluation.score}/${question.points}` })
  }

  const onDrop = useCallback((accepted: File[]) => {
    if (!selectedQuestionId) {
      toast({ title: "No question", description: "Select a question first", variant: "destructive" })
      return
    }
    const newFiles = accepted.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading" as const,
      progress: 0,
      file
    }))
    setFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => processFile(f.id, f.file))
  }, [selectedQuestionId, studentName])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"]
    },
    multiple: true
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="student-name">Student Name</Label>
          <Input id="student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="question">Question</Label>
          <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select a question" />
            </SelectTrigger>
            <SelectContent>
              {questions.map(q => (
                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div {...getRootProps()} className="border-dashed border-2 p-6 rounded-lg text-center cursor-pointer">
        <input {...getInputProps()} />
        <p>Drag & drop files here, or click to select</p>
      </div>

      {selectedFile && selectedFile.type === "application/pdf" && (
        <div className="mt-4">
          <Label>PDF Preview</Label>
          <div className="border rounded-lg p-4 bg-gray-50">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>
        </div>
      )}

      {files.map(f => (
        <Card key={f.id} className="p-4 space-y-2">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {f.type.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                <span>{f.name}</span>
              </div>
              <Badge className={getStatusColor(f.status)}>{f.status}</Badge>
            </div>
            <Progress value={f.progress} className="mt-2" />
            {f.extractedText && (
              <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-auto">
                {f.extractedText}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  function getStatusColor(status: UploadedFile["status"]) {
    switch (status) {
      case "uploading": return "bg-blue-500"
      case "processing": return "bg-yellow-500"
      case "completed": return "bg-green-500"
      case "error": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }
}
