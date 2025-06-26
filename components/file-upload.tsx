"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, File, X, CheckCircle, GitBranch, Globe } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fetchThemes, createSubmission, type Theme } from "@/lib/supabase"
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
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState<string>("")
  const [projectTitle, setProjectTitle] = useState<string>("")
  const [projectDescription, setProjectDescription] = useState<string>("")
  const [applicationUrl, setApplicationUrl] = useState<string>("")
  const [gitlabUrl, setGitlabUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadThemes() {
      setLoading(true)
      try {
        const themes = await fetchThemes()
        setThemes(themes)
        if (themes.length > 0) {
          setSelectedThemeId(themes[0].id)
        }
      } catch (error) {
        console.error("Failed to load themes:", error)
        toast({
          title: "Error",
          description: "Failed to load themes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadThemes()
  }, [])

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

    // Process each file
    newFiles.forEach((fileData) => {
      processFile(fileData.id)
    })
  }, [])

  const processFile = async (fileId: string) => {
    const updateProgress = (progress: number, status: UploadedFile["status"]) => {
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress, status } : f)))
    }

    try {
      updateProgress(25, "uploading")
      await new Promise((resolve) => setTimeout(resolve, 500))

      updateProgress(75, "processing")
      await new Promise((resolve) => setTimeout(resolve, 500))

      updateProgress(100, "completed")
    } catch (error) {
      console.error("Error processing file:", error)
      updateProgress(0, "error")
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    maxFiles: 1,
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

    setSubmitting(true)

    try {
      const submission = {
        project_title: projectTitle.trim(),
        project_description: projectDescription.trim(),
        theme_id: selectedThemeId,
        application_url: applicationUrl.trim() || null,
        gitlab_url: gitlabUrl.trim() || null,
        pdf_file_name: files[0]?.name || null,
        status: "submitted" as const,
      }

      const result = await createSubmission(submission)

      if (result) {
        toast({
          title: "Submission Successful!",
          description: "Your hackathon project has been submitted successfully.",
        })

        // Reset form
        setProjectTitle("")
        setProjectDescription("")
        setApplicationUrl("")
        setGitlabUrl("")
        setFiles([])
      }
    } catch (error) {
      console.error("Submission failed:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your project. Please try again.",
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
          {/* Project Information */}
          <div className="space-y-4">
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
              <Label htmlFor="theme-select">Select Theme *</Label>
              <Select value={selectedThemeId} onValueChange={setSelectedThemeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading themes..." : "Choose a theme"} />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.icon} {theme.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Label className="block mb-2">Project Presentation (PDF)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {isDragActive ? "Drop your PDF here" : "Upload project presentation"}
              </p>
              <p className="text-xs text-gray-500 mb-2">Drag and drop your PDF file here, or click to select</p>
              <Badge variant="secondary">PDF Only</Badge>
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
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-1" />
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
              {submitting ? "Submitting..." : "Submit Project"}
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
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
