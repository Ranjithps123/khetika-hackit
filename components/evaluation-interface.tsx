"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { CheckCircle, XCircle, AlertCircle, User, FileText, Loader2 } from "lucide-react"
import { fetchEvaluations, updateEvaluationStatus } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface StudentAnswer {
  id: string
  student_name: string
  question_id: string
  questions: { title: string }
  extracted_answer: string
  score: number
  max_points: number
  confidence: number
  status: "pending" | "reviewed" | "approved"
  feedback?: string
  final_score?: number
}

export function EvaluationInterface() {
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState<StudentAnswer | null>(null)
  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState<number[]>([0])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadEvaluationData()
  }, [])

  const loadEvaluationData = async () => {
    setLoading(true)
    try {
      const evaluationData = await fetchEvaluations()
      setAnswers(evaluationData as unknown as StudentAnswer[])
    } catch (error) {
      console.error("Failed to load evaluations:", error)
      toast({
        title: "Error",
        description: "Failed to load evaluations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (answer: StudentAnswer) => {
    setSelectedAnswer(answer)
    setFeedback(answer.feedback || "")
    setScore([answer.final_score || answer.score])
  }

  const handleUpdateStatus = async (status: "reviewed" | "approved") => {
    if (!selectedAnswer) return

    setUpdating(true)
    try {
      const success = await updateEvaluationStatus(selectedAnswer.id, status, feedback, score[0])

      if (success) {
        // Update local state
        setAnswers((prev) =>
          prev.map((a) => (a.id === selectedAnswer.id ? { ...a, status, feedback, score: score[0] } : a)),
        )

        toast({
          title: "Success",
          description: `Evaluation ${status === "approved" ? "approved" : "marked for review"}.`,
        })
      }
    } catch (error) {
      console.error("Failed to update evaluation:", error)
      toast({
        title: "Error",
        description: "Failed to update evaluation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: StudentAnswer["status"]) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600"
    if (confidence >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Answers to Review</h3>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : answers.length > 0 ? (
          answers.map((answer) => (
            <Card
              key={answer.id}
              className={`cursor-pointer transition-colors ${
                selectedAnswer?.id === answer.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => handleSelectAnswer(answer)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{answer.student_name}</span>
                    {getStatusIcon(answer.status)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {answer.score}/{answer.max_points}
                    </div>
                    <div className={`text-xs ${getConfidenceColor(answer.confidence)}`}>
                      {answer.confidence}% confidence
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <Badge variant="outline" className="mb-2">
                    {answer.questions?.title || "Unknown Question"}
                  </Badge>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">{answer.extracted_answer}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No evaluations found. Upload some answers to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {selectedAnswer ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evaluating: {selectedAnswer.student_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Question: {selectedAnswer.questions?.title || "Unknown"}</h4>
                  <div className="bg-blue-50 p-3 rounded-md mb-3">
                    <p className="text-sm text-blue-800">
                      <strong>Student Answer:</strong> {selectedAnswer.extracted_answer}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Score: {score[0]} / {selectedAnswer.max_points}
                  </label>
                  <Slider
                    value={score}
                    onValueChange={setScore}
                    max={selectedAnswer.max_points}
                    step={0.5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>AI Suggested: {selectedAnswer.score}</span>
                    <span>{selectedAnswer.max_points}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Feedback (Optional)</label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleUpdateStatus("approved")} disabled={updating}>
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Score
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpdateStatus("reviewed")}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Needs Review
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Confidence Level:</span>
                    <span className={`text-sm font-medium ${getConfidenceColor(selectedAnswer.confidence)}`}>
                      {selectedAnswer.confidence}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Analysis:</strong> {selectedAnswer.feedback || "No analysis available."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Answer to Review</h3>
              <p className="text-gray-500">Choose an answer from the list to start the evaluation process</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
