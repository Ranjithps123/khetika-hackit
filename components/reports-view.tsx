"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Users, FileText, TrendingUp, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchEvaluations, fetchQuestions } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface ReportStats {
  totalSubmissions: number
  evaluated: number
  pending: number
  averageScore: number
}

interface QuestionStat {
  id: string
  title: string
  submissions: number
  avgScore: number
  difficulty: string
}

interface StudentPerformance {
  name: string
  score: number
  submissions: number
  status: string
}

export function ReportsView() {
  const [stats, setStats] = useState<ReportStats>({
    totalSubmissions: 0,
    evaluated: 0,
    pending: 0,
    averageScore: 0,
  })
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    setLoading(true)
    try {
      // Fetch evaluations and questions
      const [evaluations, questions] = await Promise.all([fetchEvaluations(), fetchQuestions()])

      // Calculate stats
      const totalSubmissions = evaluations.length
      const evaluated = evaluations.filter((e) => e.status === "approved").length
      const pending = totalSubmissions - evaluated

      // Calculate average score
      const totalScore = evaluations.reduce(
        (sum, evaluation) => sum + (evaluation.score / evaluation.max_points) * 100,
        0,
      )
      const averageScore = totalSubmissions > 0 ? Math.round((totalScore / totalSubmissions) * 10) / 10 : 0

      setStats({
        totalSubmissions,
        evaluated,
        pending,
        averageScore,
      })

      // Process question stats
      const questionMap = new Map()
      questions.forEach((q) => {
        questionMap.set(q.id, {
          id: q.id,
          title: q.title,
          submissions: 0,
          totalScore: 0,
          maxPoints: q.points,
          difficulty: getDifficultyFromPoints(q.points),
        })
      })

      // Update question stats with evaluation data
      evaluations.forEach((evaluationItem) => {
        const questionStat = questionMap.get(evaluationItem.question_id)
        if (questionStat) {
          questionStat.submissions++
          questionStat.totalScore += evaluationItem.score
        }
      })

      // Calculate average scores for questions
      const processedQuestionStats = Array.from(questionMap.values())
        .map((q) => ({
          id: q.id,
          title: q.title,
          submissions: q.submissions,
          avgScore: q.submissions > 0 ? Math.round((q.totalScore / (q.submissions * q.maxPoints)) * 100) : 0,
          difficulty: q.difficulty,
        }))
        .sort((a, b) => b.submissions - a.submissions)

      setQuestionStats(processedQuestionStats)

      // Process student performance
      const studentMap = new Map()
      evaluations.forEach((evaluationItem) => {
        if (!studentMap.has(evaluationItem.student_name)) {
          studentMap.set(evaluationItem.student_name, {
            name: evaluationItem.student_name,
            totalScore: 0,
            totalMaxPoints: 0,
            submissions: 0,
          })
        }

        const student = studentMap.get(evaluationItem.student_name)
        student.totalScore += evaluationItem.score
        student.totalMaxPoints += evaluationItem.max_points
        student.submissions++
      })

      // Calculate student performance metrics
      const processedStudentPerformance = Array.from(studentMap.values())
        .map((s) => {
          const scorePercentage = s.totalMaxPoints > 0 ? Math.round((s.totalScore / s.totalMaxPoints) * 100) : 0
          return {
            name: s.name,
            score: scorePercentage,
            submissions: s.submissions,
            status: getStatusFromScore(scorePercentage),
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5) // Top 5 students

      setStudentPerformance(processedStudentPerformance)
    } catch (error) {
      console.error("Failed to load report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyFromPoints = (points: number): string => {
    if (points <= 3) return "Easy"
    if (points <= 7) return "Medium"
    return "Hard"
  }

  const getStatusFromScore = (score: number): string => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Satisfactory"
    return "Needs Improvement"
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800"
      case "Good":
        return "bg-blue-100 text-blue-800"
      case "Satisfactory":
        return "bg-yellow-100 text-yellow-800"
      case "Needs Improvement":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.evaluated}</p>
                <p className="text-sm text-gray-600">Evaluated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Performance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Question Performance</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questionStats.length > 0 ? (
              <div className="space-y-4">
                {questionStats.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{question.title}</span>
                        <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">{question.avgScore}% avg</span>
                    </div>
                    <Progress value={question.avgScore} className="h-2" />
                    <p className="text-xs text-gray-500">{question.submissions} submissions</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No question data available</p>
            )}
          </CardContent>
        </Card>

        {/* Student Performance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Top Student Performance</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentPerformance.length > 0 ? (
              <div className="space-y-4">
                {studentPerformance.map((student, index) => (
                  <div key={student.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.submissions} submissions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{student.score}%</p>
                      <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No student performance data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {stats.totalSubmissions > 0 ? Math.round((stats.evaluated / stats.totalSubmissions) * 100) : 0}%
                Complete
              </span>
            </div>
            <Progress
              value={stats.totalSubmissions > 0 ? (stats.evaluated / stats.totalSubmissions) * 100 : 0}
              className="h-3"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Evaluated:</span>
                <span className="font-medium text-green-600">{stats.evaluated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-yellow-600">{stats.pending}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
