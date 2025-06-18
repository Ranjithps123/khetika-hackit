import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Question = {
  id: string
  title: string
  question_text: string
  type: "multiple-choice" | "short-answer" | "essay"
  points: number
  rubric: string
  expected_answer: string
  keywords: string[]
  created_at?: string
}

export type Evaluation = {
  id?: string
  file_id: string
  student_name: string
  question_id: string
  extracted_answer: string
  score: number
  max_points: number
  confidence: number
  feedback: string
  rubric_match: string[]
  status?: "pending" | "reviewed" | "approved"
  created_at?: string
}

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching questions:", error)
    return []
  }

  return data || []
}

export async function createQuestion(question: Omit<Question, "id" | "created_at">): Promise<Question | null> {
  const { data, error } = await supabase.from("questions").insert([question]).select()

  if (error) {
    console.error("Error creating question:", error)
    return null
  }

  return data?.[0] || null
}

export async function updateQuestion(id: string, question: Partial<Question>): Promise<Question | null> {
  const { data, error } = await supabase.from("questions").update(question).eq("id", id).select()

  if (error) {
    console.error("Error updating question:", error)
    return null
  }

  return data?.[0] || null
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from("questions").delete().eq("id", id)

  if (error) {
    console.error("Error deleting question:", error)
    return false
  }

  return true
}

export async function createEvaluation(evaluation: Omit<Evaluation, "id" | "created_at">): Promise<Evaluation | null> {
  const { data, error } = await supabase.from("evaluations").insert([evaluation]).select()

  if (error) {
    console.error("Error creating evaluation:", error)
    return null
  }

  return data?.[0] || null
}

export async function fetchEvaluations(): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*, questions(title)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching evaluations:", error)
    return []
  }

  return data || []
}

export async function updateEvaluationStatus(
  id: string,
  status: "pending" | "reviewed" | "approved",
  feedback?: string,
  score?: number,
): Promise<boolean> {
  const updateData: any = { status }
  if (feedback !== undefined) updateData.feedback = feedback
  if (score !== undefined) updateData.score = score

  const { error } = await supabase.from("evaluations").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating evaluation status:", error)
    return false
  }

  return true
}
