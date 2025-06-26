"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import ThemeManager from "@/components/theme-manager"
import SubmissionInterface from "@/components/submission-interface"
import ReportsView from "@/components/reports-view"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/navbar"
import { HackathonInfo } from "@/components/hackathon-info"
import { useAuth } from "@/components/auth/auth-provider"

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto py-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Khetika - Hack it
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
              Build innovative solutions for India's agricultural supply chain. Choose a theme, develop your solution,
              and submit your project to compete for exciting prizes!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-blue-800 font-medium">
                📅 4-Day Hackathon | Individual Participation | Showcase on Monday Standup
              </p>
            </div>
          </div>

          <HomeContent />
        </main>
      </div>
    </ProtectedRoute>
  )
}

function HomeContent() {
  const { isAdmin } = useAuth()

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className={`grid mb-8 ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
        <TabsTrigger value="info">Hackathon Info</TabsTrigger>
        <TabsTrigger value="submit">Submit Project</TabsTrigger>
        <TabsTrigger value="themes">Themes</TabsTrigger>
        {isAdmin && <TabsTrigger value="submissions">Review Submissions</TabsTrigger>}
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <HackathonInfo />
      </TabsContent>

      <TabsContent value="submit">
        <FileUpload />
      </TabsContent>

      <TabsContent value="themes">
        <ThemeManager />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="submissions">
          <SubmissionInterface />
        </TabsContent>
      )}

      <TabsContent value="leaderboard">
        <ReportsView />
      </TabsContent>
    </Tabs>
  )
}
