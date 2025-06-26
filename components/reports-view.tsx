"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Users, FileText, TrendingUp, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchSubmissions, fetchThemes } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface ReportStats {
  totalSubmissions: number
  evaluated: number
  pending: number
  averageScore: number
}

interface ThemeStat {
  id: string
  title: string
  submissions: number
  avgScore: number
  difficulty: string
}

interface TeamPerformance {
  name: string
  score: number
  submissions: number
  status: string
}

export default function ReportsView() {
  const [stats, setStats] = useState<ReportStats>({
    totalSubmissions: 0,
    evaluated: 0,
    pending: 0,
    averageScore: 0,
  })
  const [themeStats, setThemeStats] = useState<ThemeStat[]>([])
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Loading report data...")

      // Fetch data with error handling
      const [submissions, themes] = await Promise.allSettled([fetchSubmissions(), fetchThemes()])

      let submissionsData: any[] = []
      let themesData: any[] = []

      // Handle submissions result
      if (submissions.status === "fulfilled") {
        submissionsData = submissions.value || []
        console.log("Submissions loaded:", submissionsData.length)
      } else {
        console.error("Failed to fetch submissions:", submissions.reason)
        submissionsData = []
      }

      // Handle themes result
      if (themes.status === "fulfilled") {
        themesData = themes.value || []
        console.log("Themes loaded:", themesData.length)
      } else {
        console.error("Failed to fetch themes:", themes.reason)
        themesData = []
      }

      // Calculate stats
      const totalSubmissions = submissionsData.length
      const reviewed = submissionsData.filter((s) => s.status === "reviewed" || s.status === "winner").length
      const pending = submissionsData.filter((s) => s.status === "submitted").length

      // Calculate average score
      const scoredSubmissions = submissionsData.filter((s) => s.score && s.score > 0)
      const totalScore = scoredSubmissions.reduce((sum, submission) => sum + (submission.score || 0), 0)
      const averageScore =
        scoredSubmissions.length > 0 ? Math.round((totalScore / scoredSubmissions.length) * 10) / 10 : 0

      setStats({
        totalSubmissions,
        evaluated: reviewed,
        pending,
        averageScore,
      })

      // Process theme stats
      const themeMap = new Map()
      themesData.forEach((t) => {
        themeMap.set(t.id, {
          id: t.id,
          title: t.title,
          submissions: 0,
          totalScore: 0,
          difficulty: t.difficulty || "medium",
        })
      })

      // Update theme stats with submission data
      submissionsData.forEach((submission) => {
        const themeStat = themeMap.get(submission.theme_id)
        if (themeStat) {
          themeStat.submissions++
          if (submission.score) {
            themeStat.totalScore += submission.score
          }
        } else {
          // Handle submissions with unknown themes
          themeMap.set(submission.theme_id, {
            id: submission.theme_id,
            title: submission.themes?.title || "Unknown Theme",
            submissions: 1,
            totalScore: submission.score || 0,
            difficulty: "medium",
          })
        }
      })

      // Calculate average scores for themes
      const processedThemeStats = Array.from(themeMap.values())
        .map((t) => ({
          id: t.id,
          title: t.title,
          submissions: t.submissions,
          avgScore: t.submissions > 0 ? Math.round(t.totalScore / t.submissions) : 0,
          difficulty: t.difficulty,
        }))
        .sort((a, b) => b.submissions - a.submissions)

      setThemeStats(processedThemeStats)

      // Process team performance (individual participants)
      const participantMap = new Map()
      submissionsData.forEach((submission) => {
        // Use user_profiles data if available, otherwise fall back to team_name
        let participantName = "Unknown Participant"

        if (submission.user_profiles?.full_name) {
          participantName = submission.user_profiles.full_name
        } else if (submission.user_profiles?.email) {
          participantName = submission.user_profiles.email
        } else if (submission.team_name) {
          participantName = submission.team_name
        }

        if (!participantMap.has(participantName)) {
          participantMap.set(participantName, {
            name: participantName,
            score: submission.score || 0,
            submissions: 0,
            status: submission.status || "submitted",
          })
        }

        const participant = participantMap.get(participantName)
        participant.submissions++
        if (submission.score && submission.score > participant.score) {
          participant.score = submission.score
          participant.status = submission.status
        }
      })

      // Calculate participant performance metrics
      const processedParticipantPerformance = Array.from(participantMap.values())
        .map((p) => ({
          name: p.name,
          score: p.score,
          submissions: p.submissions,
          status: getStatusFromScore(p.score),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // Top 10 participants

      setTeamPerformance(processedParticipantPerformance)

      console.log("Report data loaded successfully")
    } catch (error) {
      console.error("Failed to load report data:", error)
      setError("Failed to load leaderboard data. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load leaderboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusFromScore = (score: number): string => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Satisfactory"
    return "Needs Improvement"
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
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
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading leaderboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadReportData} variant="outline">
            Try Again
          </Button>
        </div>
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
                <p className="text-sm text-gray-600">Reviewed</p>
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
        {/* Theme Performance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Theme Performance</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {themeStats.length > 0 ? (
              <div className="space-y-4">
                {themeStats.map((theme) => (
                  <div key={theme.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{theme.title}</span>
                        <Badge className={getDifficultyColor(theme.difficulty)}>{theme.difficulty}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">{theme.avgScore}% avg</span>
                    </div>
                    <Progress value={theme.avgScore} className="h-2" />
                    <p className="text-xs text-gray-500">{theme.submissions} submissions</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No theme data available</p>
            )}
          </CardContent>
        </Card>

        {/* Participant Performance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Top Participants</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teamPerformance.length > 0 ? (
              <div className="space-y-4">
                {teamPerformance.map((participant, index) => (
                  <div key={participant.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-gray-600">{participant.submissions} submissions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{participant.score}/100</p>
                      <Badge className={getStatusColor(participant.status)}>{participant.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No participant data available</p>
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
