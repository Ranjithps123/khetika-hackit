import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import QuestionManager from "@/components/question-manager"
import EvaluationInterface from "@/components/evaluation-interface"
import ReportsView from "@/components/reports-view"

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Answer Evaluation System</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <FileUpload />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionManager />
        </TabsContent>

        <TabsContent value="evaluate">
          <EvaluationInterface />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsView />
        </TabsContent>
      </Tabs>
    </main>
  )
}
