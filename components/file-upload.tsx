"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Question {
  id: string
  title: string
  question_text: string
}

interface Answer {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean
}

interface UploadedFile {
  name: string
  size: number
  type: string
  lastModified: number
  lastModifiedDate: Date
}

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [isCorrect, setIsCorrect] = useState(false)
  const { toast } = useToast()
  const [answers, setAnswers] = useState<Answer[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  useEffect(() => {
    // Fetch questions from the API
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/questions")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setQuestions(data)
      } catch (error) {
        console.error("Could not fetch questions:", error)
        toast({
          title: "Error fetching questions",
          description: "Failed to load questions from the server.",
          variant: "destructive",
        })
      }
    }

    fetchQuestions()

    // Fetch answers from the API
    const fetchAnswers = async () => {
      try {
        const response = await fetch("/api/answers")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setAnswers(data)
      } catch (error) {
        console.error("Could not fetch answers:", error)
        toast({
          title: "Error fetching answers",
          description: "Failed to load answers from the server.",
          variant: "destructive",
        })
      }
    }

    fetchAnswers()
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadedFiles((prevFiles) => [
        ...prevFiles,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          lastModifiedDate: new Date(file.lastModified),
        },
      ])
    }
  }

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestionId(questionId)
  }

  const handleAnswerTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnswerText(event.target.value)
  }

  const handleIsCorrectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsCorrect(event.target.checked)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedQuestionId) {
      toast({
        title: "Error",
        description: "Please select a question.",
        variant: "destructive",
      })
      return
    }

    if (!answerText) {
      toast({
        title: "Error",
        description: "Please enter an answer.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: selectedQuestionId,
          answer_text: answerText,
          is_correct: isCorrect,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Answer submitted successfully!",
        })
        setAnswerText("")
        setIsCorrect(false)

        // Refresh answers
        const fetchAnswers = async () => {
          try {
            const response = await fetch("/api/answers")
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setAnswers(data)
          } catch (error) {
            console.error("Could not fetch answers:", error)
            toast({
              title: "Error fetching answers",
              description: "Failed to load answers from the server.",
              variant: "destructive",
            })
          }
        }

        fetchAnswers()
      } else {
        toast({
          title: "Error",
          description: "Failed to submit answer.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      toast({
        title: "Error",
        description: "Failed to submit answer.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>File Upload and Answer Submission</CardTitle>
          <CardDescription>Upload a file, select a question, and submit an answer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="file">Upload File</Label>
              <Input id="file" type="file" onChange={handleFileChange} className="mt-2" />
            </div>

            <div>
              <Label htmlFor="question">Select Question</Label>
              <Select onValueChange={handleQuestionSelect}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((question) => (
                    <SelectItem key={question.id} value={question.id}>
                      {question.title} - {question.question_text.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="answer">Answer</Label>
              <Input id="answer" type="text" value={answerText} onChange={handleAnswerTextChange} className="mt-2" />
            </div>

            <div className="flex items-center space-x-2">
              <Input id="isCorrect" type="checkbox" checked={isCorrect} onChange={handleIsCorrectChange} />
              <Label htmlFor="isCorrect">Is Correct</Label>
            </div>

            <Button onClick={handleSubmit}>Submit Answer</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>List of uploaded files.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your uploaded files.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedFiles.map((file) => (
                <TableRow key={file.name}>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell>{file.lastModifiedDate.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Answers</CardTitle>
          <CardDescription>List of answers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of answers.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Question ID</TableHead>
                <TableHead>Answer Text</TableHead>
                <TableHead>Is Correct</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {answers.map((answer) => (
                <TableRow key={answer.id}>
                  <TableCell className="font-medium">{answer.question_id}</TableCell>
                  <TableCell>{answer.answer_text}</TableCell>
                  <TableCell>{answer.is_correct ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUpload
