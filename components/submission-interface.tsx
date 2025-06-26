"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { CheckCircle, XCircle, AlertCircle, Users, FileText, Loader2, ExternalLink, GitBranch } from "lucide-react"
import { fetchSubmissions, fetchUserSubmissions, updateSubmissionStatus } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "@/hooks/use-toast"

interface Submission {
  id: string
  user_id: string
  project_title: string
  project_description: string
  theme_id: string
  themes?: { title: string; icon: string }
  user_profiles?: { full_name: string; email: string }
  application_url?: string
  gitlab_url?: string
  pdf_file_name?: string
  score: number
  max_score: number
  feedback?: string
  status: "submitted" | "reviewed" | "winner"
  created_at: string
}

export default function SubmissionInterface() {
  const { isAdmin } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState<number[]>([0])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [isAdmin])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const submissionData = isAdmin ? await fetchSubmissions() : await fetchUserSubmissions()
      console.log("Loaded submissions:", submissionData)
      setSubmissions(submissionData as Submission[])
    } catch (error) {
      console.error("Failed to load submissions:", error)
      toast({
        title: "Error",
        description: "Failed to load submissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.feedback || "")
    setScore([submission.score || 0])
  }

  const handleUpdateStatus = async (status: "reviewed" | "winner") => {
    if (!selectedSubmission || !isAdmin) return

    setUpdating(true)
    try {
      const success = await updateSubmissionStatus(selectedSubmission.id, status, feedback, score[0])

      if (success) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === selectedSubmission.id ? { ...s, status, feedback, score: score[0] } : s)),
        )

        toast({
          title: "Success",
          description: `Submission ${status === "winner" ? "marked as winner" : "reviewed"}.`,
        })
      }
    } catch (error) {
      console.error("Failed to update submission:", error)
      toast({
        title: "Error",
        description: "Failed to update submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: Submission["status"]) => {
    switch (status) {
      case "submitted":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "winner":
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusColor = (status: Submission["status"]) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800"
      case "reviewed":
        return "bg-blue-100 text-blue-800"
      case "winner":
        return "bg-green-100 text-green-800"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {isAdmin ? `All Submissions (${submissions.length})` : `My Submissions (${submissions.length})`}
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : submissions.length > 0 ? (
          submissions.map((submission) => (
            <Card
              key={submission.id}
              className={`cursor-pointer transition-colors ${
                selectedSubmission?.id === submission.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => handleSelectSubmission(submission)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">
                      {isAdmin
                        ? submission.user_profiles?.full_name || submission.user_profiles?.email || "Unknown User"
                        : "My Project"}
                    </span>
                    {getStatusIcon(submission.status)}
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
                    {submission.score > 0 && <div className="text-sm font-medium mt-1">{submission.score}/100</div>}
                  </div>
                </div>

                <div className="mb-2">
                  <h4 className="font-medium text-lg">{submission.project_title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{submission.themes?.icon || "❓"}</span>
                    <Badge variant="outline" className="text-xs">
                      {submission.themes?.title || "Unknown Theme"}
                    </Badge>
                  </div>
                </div>

                {submission.project_description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{submission.project_description}</p>
                )}

                <div className="flex gap-2 text-xs">
                  {submission.application_url && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      App
                    </Badge>
                  )}
                  {submission.gitlab_url && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      Code
                    </Badge>
                  )}
                  {submission.pdf_file_name && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      PDF
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {isAdmin
                  ? "No submissions found. Participants will appear here once they submit their projects."
                  : "You haven't submitted any projects yet. Go to the Submit Project tab to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {selectedSubmission ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isAdmin ? "Reviewing" : "Project Details"}:{" "}
                  {isAdmin
                    ? selectedSubmission.user_profiles?.full_name || "Unknown User"
                    : selectedSubmission.project_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Project: {selectedSubmission.project_title}</h4>
                  <div className="bg-blue-50 p-3 rounded-md mb-3">
                    <p className="text-sm text-blue-800">
                      <strong>Theme:</strong> {selectedSubmission.themes?.icon || "❓"}{" "}
                      {selectedSubmission.themes?.title || "Unknown Theme"}
                    </p>
                    {selectedSubmission.project_description && (
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>Description:</strong> {selectedSubmission.project_description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mb-3">
                    {selectedSubmission.application_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedSubmission.application_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View App
                        </a>
                      </Button>
                    )}
                    {selectedSubmission.gitlab_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedSubmission.gitlab_url} target="_blank" rel="noopener noreferrer">
                          <GitBranch className="h-4 w-4 mr-2" />
                          View Code
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Score: {score[0]} / 100</label>
                      <Slider value={score} onValueChange={setScore} max={100} step={1} className="mb-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>Current: {selectedSubmission.score}</span>
                        <span>100</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Feedback</label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide feedback for the participant..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handleUpdateStatus("winner")} disabled={updating}>
                        {updating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Winner
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
                        Mark Reviewed
                      </Button>
                    </div>
                  </>
                )}

                {!isAdmin && selectedSubmission.feedback && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium text-sm mb-1">Feedback from Judges:</h5>
                    <p className="text-sm text-gray-700">{selectedSubmission.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isAdmin ? "Select a Submission to Review" : "Select a Project to View Details"}
              </h3>
              <p className="text-gray-500">
                {isAdmin
                  ? "Choose a submission from the list to start the review process"
                  : "Choose a project from the list to view details and feedback"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
