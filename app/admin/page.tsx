import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ThemeManager from "@/components/theme-manager"
import SubmissionInterface from "@/components/submission-interface"
import ReportsView from "@/components/reports-view"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/navbar"

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto py-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Khetika - Hack it
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Admin Dashboard</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Manage hackathon themes, review submissions, and track participant progress.
            </p>
          </div>

          <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="submissions">Review Submissions</TabsTrigger>
              <TabsTrigger value="themes">Manage Themes</TabsTrigger>
              <TabsTrigger value="reports">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions">
              <SubmissionInterface />
            </TabsContent>

            <TabsContent value="themes">
              <ThemeManager />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsView />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
