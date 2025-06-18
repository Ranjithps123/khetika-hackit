"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, Loader2 } from "lucide-react"
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion, type Question } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

export function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const data = await fetchQuestions()
      setQuestions(data)
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

  const createNewQuestion = () => {
    const newQuestion: Question = {
      id: "",
      title: "",
      question: "",
      type: "short-answer",
      points: 0,
      rubric: "",
      sample_answer: "",
      keywords: [],
    }
    setEditingQuestion(newQuestion)
    setIsCreating(true)
  }

  const saveQuestion = async () => {
    if (!editingQuestion) return

    setSaving(true)
    try {
      // Validate required fields
      if (!editingQuestion.title || !editingQuestion.question) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Process keywords from comma-separated string if needed
      let keywords = editingQuestion.keywords
      if (typeof keywords === "string") {
        keywords = (keywords as unknown as string).split(",").map((k) => k.trim())
      }

      if (isCreating) {
        const result = await createQuestion({
          ...editingQuestion,
          keywords: keywords,
        })

        if (result) {
          setQuestions((prev) => [...prev, result])
          toast({
            title: "Success",
            description: "Question created successfully.",
          })
        }
      } else {
        const result = await updateQuestion(editingQuestion.id, {
          ...editingQuestion,
          keywords: keywords,
        })

        if (result) {
          setQuestions((prev) => prev.map((q) => (q.id === result.id ? result : q)))
          toast({
            title: "Success",
            description: "Question updated successfully.",
          })
        }
      }

      setEditingQuestion(null)
      setIsCreating(false)
    } catch (error) {
      console.error("Failed to save question:", error)
      toast({
        title: "Error",
        description: "Failed to save question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    setDeleting(id)
    try {
      const success = await deleteQuestion(id)
      if (success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        toast({
          title: "Success",
          description: "Question deleted successfully.",
        })
      }
    } catch (error) {
      console.error("Failed to delete question:", error)
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const getTypeColor = (type: Question["type"]) => {
    switch (type) {
      case "multiple-choice":
        return "bg-blue-100 text-blue-800"
      case "short-answer":
        return "bg-green-100 text-green-800"
      case "essay":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questions ({questions.length})</h3>
        <Button onClick={createNewQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {editingQuestion && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{isCreating ? "Create New Question" : "Edit Question"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Question Title</Label>
                <Input
                  id="title"
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  placeholder="Enter question title"
                />
              </div>
              <div>
                <Label htmlFor="type">Question Type</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value: Question["type"]) =>
                    setEditingQuestion((prev) => (prev ? { ...prev, type: value } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="question">Question Text</Label>
              <Textarea
                id="question"
                value={editingQuestion.question}
                onChange={(e) => setEditingQuestion((prev) => (prev ? { ...prev, question: e.target.value } : null))}
                placeholder="Enter the question"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={editingQuestion.points}
                onChange={(e) =>
                  setEditingQuestion((prev) =>
                    prev ? { ...prev, points: Number.parseInt(e.target.value) || 0 } : null,
                  )
                }
                placeholder="Points for this question"
              />
            </div>

            <div>
              <Label htmlFor="rubric">Evaluation Rubric</Label>
              <Textarea
                id="rubric"
                value={editingQuestion.rubric}
                onChange={(e) => setEditingQuestion((prev) => (prev ? { ...prev, rubric: e.target.value } : null))}
                placeholder="Describe how this question should be evaluated"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="sample">Sample Answer</Label>
              <Textarea
                id="sample"
                value={editingQuestion.sample_answer}
                onChange={(e) =>
                  setEditingQuestion((prev) => (prev ? { ...prev, sample_answer: e.target.value } : null))
                }
                placeholder="Provide a sample correct answer"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                value={
                  Array.isArray(editingQuestion.keywords)
                    ? editingQuestion.keywords.join(", ")
                    : editingQuestion.keywords
                }
                onChange={(e) =>
                  setEditingQuestion((prev) =>
                    prev ? { ...prev, keywords: e.target.value.split(",").map((k) => k.trim()) } : null,
                  )
                }
                placeholder="Enter keywords separated by commas"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveQuestion} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Question
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingQuestion(null)
                  setIsCreating(false)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{question.title}</h4>
                    <Badge className={getTypeColor(question.type)}>{question.type.replace("-", " ")}</Badge>
                    <Badge variant="outline">{question.points} pts</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{question.question}</p>
                  <p className="text-xs text-gray-500">
                    <strong>Sample:</strong> {question.sample_answer}
                  </p>
                  {question.keywords && question.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingQuestion(question)
                      setIsCreating(false)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={deleting === question.id}
                  >
                    {deleting === question.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
