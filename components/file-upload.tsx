"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, File, X, CheckCircle, GitBranch, Globe, User, Loader2, AlertCircle, Info, Shield } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fetchThemes, createSubmission, getThemesSync, preloadThemes, type Theme } from "@/lib/supabase"
import { uploadPDF, initializeStorage, testStorageAccess, type UploadResult } from "@/lib/storage"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  file: File
  uploadResult?: UploadResult
  errorMessage?: string
}

export function FileUpload() {
  const { user, profile } = useAuth()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [themes, setThemes] = useState<Theme[]>(getThemesSync()) // Start with cached/default themes
  const [selectedThemeId, setSelectedThemeId] = useState<string>("")
  const [projectTitle, setProjectTitle] = useState<string>("")
  const [projectDescription, setProjectDescription] = useState<string>("")
  const [participantName, setParticipantName] = useState<string>("")
  const [applicationUrl, setApplicationUrl] = useState<string>("")
  const [gitlabUrl, setGitlabUrl] = useState<string>("")
  const [loadingThemes, setLoadingThemes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [storageReady, setStorageReady] = useState<boolean | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize storage on component mount (non-blocking)
    initializeStorage()

    // Check if storage is ready
    checkStorageStatus()

    // Preload themes in background
    preloadThemes()

    // Set default theme selection
    if (themes.length > 0 && !selectedThemeId) {
      setSelectedThemeId(themes[0].id)
    }

    // Load fresh themes from database
    loadThemes()
  }, [])

  useEffect(() => {
    // Set default participant name from user data
    if (profile?.full_name) {
      setParticipantName(profile.full_name)
    } else if (profile?.email) {
      setParticipantName(profile.email.split("@")[0])
    } else if (user?.email) {
      setParticipantName(user.email.split("@")[0])
    }
  }, [user, profile])

  const checkStorageStatus = async () => {
    try {
      const testResult = await testStorageAccess()
      setStorageReady(testResult.success)
      if (!testResult.success) {
        setStorageError(testResult.message)
        console.log("Storage test failed:", testResult.message)
      } else {
        setStorageError(null)
        console.log("Storage test passed:", testResult.message)
      }
    } catch (error: any) {
      console.error("Storage check failed:", error)
      setStorageReady(false)
      setStorageError(error.message || "Storage check failed")
    }
  }

  const loadThemes = async () => {
    setLoadingThemes(true)
    try {
      const freshThemes = await fetchThemes()
      setThemes(freshThemes)

      // Set default selection if not already set
      if (freshThemes.length > 0 && !selectedThemeId) {
        setSelectedThemeId(freshThemes[0].id)
      }

      console.log("Fresh themes loaded:", freshThemes.length)
    } catch (error) {
      console.error("Failed to load fresh themes:", error)
      // Keep using the default themes that were already loaded
      toast({
        title: "Info",
        description: "Using default themes. Database connection may be slow.",
      })
    } finally {
      setLoadingThemes(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading" as const,
      progress: 0,
      file: file,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Process each file - pass the file data directly
    newFiles.forEach((fileData) => {
      processFile(fileData)
    })
  }, [])

  const processFile = async (fileData: UploadedFile) => {
    const updateProgress = (
      progress: number,
      status: UploadedFile["status"],
      uploadResult?: UploadResult,
      errorMessage?: string,
    ) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileData.id ? { ...f, progress, status, uploadResult, errorMessage } : f)),
      )
    }

    try {
      console.log("Processing file:", fileData.name, "ID:", fileData.id)
      updateProgress(25, "uploading")

      // Check if user is authenticated
      if (!user) {
        throw new Error("You must be logged in to upload files")
      }

      // Generate a temporary submission ID for file naming
      const tempSubmissionId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      updateProgress(50, "processing")

      // Upload PDF to Supabase Storage
      console.log("Uploading PDF to storage...")
      const uploadResult = await uploadPDF(fileData.file, tempSubmissionId)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed")
      }

      console.log("PDF upload successful:", uploadResult.url)
      updateProgress(100, "completed", uploadResult)

      toast({
        title: "PDF Uploaded",
        description: "Your PDF has been uploaded successfully and will be linked to your submission.",
      })

      // Update storage status if upload was successful
      if (storageReady === false) {
        setStorageReady(true)
        setStorageError(null)
      }
    } catch (error: any) {
      console.error("Error processing file:", error)
      updateProgress(0, "error", undefined, error.message)

      let errorMessage = error.message || "Failed to upload PDF. Please try again."

      // Provide more helpful error messages
      if (error.message?.includes("row-level security") || error.message?.includes("policy")) {
        errorMessage = "Storage permissions issue. Please contact administrator to configure storage policies properly."
      } else if (error.message?.includes("Bucket not found")) {
        errorMessage = "Storage not configured. Please contact administrator."
      } else if (error.message?.includes("size")) {
        errorMessage = "File too large. Please use a PDF under 10MB."
      } else if (error.message?.includes("not authenticated")) {
        errorMessage = "Please sign in to upload files."
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const retryUpload = (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (file) {
      // Reset file status and retry
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "uploading", progress: 0, errorMessage: undefined } : f)),
      )
      processFile(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleSubmit = async () => {
    // Validation
    if (!projectTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your project title.",
        variant: "destructive",
      })
      return
    }

    if (!participantName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name.",
        variant: "destructive",
      })
      return
    }

    if (!selectedThemeId) {
      toast({
        title: "Missing Information",
        description: "Please select a theme.",
        variant: "destructive",
      })
      return
    }

    if (!applicationUrl.trim() && !gitlabUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide either an application URL or GitLab repository URL.",
        variant: "destructive",
      })
      return
    }

    // Check if any files are still uploading
    const uploadingFiles = files.filter((f) => f.status === "uploading" || f.status === "processing")
    if (uploadingFiles.length > 0) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for PDF upload to complete before submitting.",
        variant: "destructive",
      })
      return
    }

    // Check for upload errors
    const errorFiles = files.filter((f) => f.status === "error")
    if (errorFiles.length > 0) {
      toast({
        title: "Upload Error",
        description:
          "Please fix PDF upload errors before submitting, or remove the failed upload and continue without PDF.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const completedFile = files.find((f) => f.status === "completed")

      const submission = {
        team_name: participantName.trim(),
        team_members: null,
        project_title: projectTitle.trim(),
        project_description: projectDescription.trim(),
        theme_id: selectedThemeId,
        application_url: applicationUrl.trim() || null,
        gitlab_url: gitlabUrl.trim() || null,
        pdf_file_name: completedFile?.name || null,
        pdf_url: completedFile?.uploadResult?.url || null,
        pdf_path: completedFile?.uploadResult?.path || null,
        status: "submitted" as const,
      }

      console.log("Submitting:", submission)

      const result = await createSubmission(submission)

      if (result) {
        toast({
          title: "Submission Successful!",
          description: completedFile
            ? "Your hackathon project has been submitted successfully with PDF attachment."
            : "Your hackathon project has been submitted successfully.",
        })

        // Reset form
        setProjectTitle("")
        setProjectDescription("")
        setApplicationUrl("")
        setGitlabUrl("")
        setFiles([])
      }
    } catch (error: any) {
      console.error("Submission failed:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
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

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submit Your Hackathon Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Status Info */}
          {storageReady === false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-red-800">
                    <strong>Storage Issue:</strong> PDF upload is not available due to configuration issues.
                  </p>
                  {storageError && <p className="text-xs text-red-700 mt-1">{storageError}</p>}
                  <p className="text-xs text-red-700 mt-1">
                    You can still submit your project without a PDF. Contact administrator to fix storage policies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {storageReady === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>Checking storage...</strong> Verifying PDF upload capabilities.
                </p>
              </div>
            </div>
          )}

          {/* Participant Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="participant-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Name *
              </Label>
              <Input
                id="participant-name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used as your participant identifier for individual participation
              </p>
            </div>

            <div>
              <Label htmlFor="project-title">Project Title *</Label>
              <Input
                id="project-title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter your project title"
                required
              />
            </div>

            <div>
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Briefly describe your project, the problem it solves, and your approach..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="theme-select" className="flex items-center gap-2">
                Select Theme *{loadingThemes && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              </Label>
              <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.icon} {theme.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingThemes && <p className="text-xs text-blue-600 mt-1">Loading latest themes from database...</p>}
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="application-url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Application URL
              </Label>
              <Input
                id="application-url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://your-app.vercel.app"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="gitlab-url" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                GitLab Repository URL
              </Label>
              <Input
                id="gitlab-url"
                value={gitlabUrl}
                onChange={(e) => setGitlabUrl(e.target.value)}
                placeholder="https://gitlab.com/username/project"
                type="url"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label className="block mb-2">Project Presentation (PDF) - Optional</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : storageReady === false
                    ? "border-red-300 bg-red-50 cursor-not-allowed"
                    : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} disabled={storageReady === false} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {isDragActive
                  ? "Drop your PDF here"
                  : storageReady === false
                    ? "PDF upload unavailable"
                    : "Upload project presentation"}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {storageReady === false
                  ? "Storage configuration issue - contact administrator"
                  : "Drag and drop your PDF file here, or click to select"}
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">PDF Only</Badge>
                <Badge variant="secondary">Max 10MB</Badge>
                <Badge variant="secondary">Optional</Badge>
                {storageReady === false && <Badge variant="destructive">Unavailable</Badge>}
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <File className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            {file.uploadResult?.url && <p className="text-xs text-green-600">✓ Uploaded to storage</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`${getStatusColor(file.status)} text-white`}>
                              {file.status}
                            </Badge>
                            {getStatusIcon(file.status)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {file.status === "error" && (
                            <Button variant="ghost" size="sm" onClick={() => retryUpload(file.id)}>
                              <Loader2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {file.status !== "completed" && file.status !== "error" && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-1" />
                        </div>
                      )}

                      {file.status === "error" && (
                        <div className="mt-2 text-xs text-red-600">
                          <p>
                            <strong>Error:</strong> {file.errorMessage || "Upload failed"}
                          </p>
                          <p className="mt-1">You can retry upload, remove this file, or submit without PDF.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} disabled={submitting} size="lg" className="min-w-32">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Required:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Your full name (individual participation)</li>
                <li>• Project title and description</li>
                <li>• Select one theme from the available options</li>
                <li>• Either application URL or GitLab repository</li>
                <li>• PDF presentation (optional but recommended)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tips:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Include screenshots in your PDF</li>
                <li>• Explain your technical approach</li>
                <li>• Highlight innovation and impact</li>
                <li>• Test your URLs before submitting</li>
                <li>• Individual participation - showcase your skills!</li>
                <li>• PDF files are stored securely for evaluation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
