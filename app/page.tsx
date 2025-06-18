"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { QuestionManager } from "@/components/question-manager"
import { EvaluationInterface } from "@/components/evaluation-interface"
import { ReportsView } from "@/components/reports-view"
import { FileText, Upload, CheckCircle, BarChart3 } from "lucide-react"

export default function EvaluationSystem() {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Answer Evaluation System</h1>
          <p className="text-lg text-gray-600">
            Upload, evaluate, and analyze student answers with AI-powered assessment
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="evaluate" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Evaluate
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Answer Sheets</CardTitle>
                <CardDescription>Upload student answers in PDF, image, or text format for evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Question Management</CardTitle>
                <CardDescription>Create and manage questions with answer keys and rubrics</CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluate">
            <Card>
              <CardHeader>
                <CardTitle>Answer Evaluation</CardTitle>
                <CardDescription>Review and evaluate extracted answers against question rubrics</CardDescription>
              </CardHeader>
              <CardContent>
                <EvaluationInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Reports</CardTitle>
                <CardDescription>View detailed reports and analytics of evaluation results</CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsView />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
