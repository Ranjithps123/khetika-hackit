import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Theme = {
  id: string
  title: string
  description: string
  icon: string
  difficulty: "easy" | "medium" | "hard"
  prize_pool: number
  max_teams: number
  created_at?: string
}

export type Submission = {
  id?: string
  user_id?: string
  project_title: string
  project_description: string
  theme_id: string
  application_url?: string | null
  gitlab_url?: string | null
  pdf_file_name?: string | null
  score?: number
  max_score?: number
  feedback?: string
  status?: "submitted" | "reviewed" | "winner"
  created_at?: string
  themes?: {
    title: string
    icon: string
  }
  user_profiles?: {
    full_name: string
    email: string
  }
}

export async function fetchThemes(): Promise<Theme[]> {
  try {
    const { data, error } = await supabase.from("themes").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching themes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching themes:", error)
    return []
  }
}

export async function createTheme(theme: Omit<Theme, "id" | "created_at">): Promise<Theme | null> {
  try {
    const { data, error } = await supabase.from("themes").insert([theme]).select()

    if (error) {
      console.error("Error creating theme:", error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error creating theme:", error)
    return null
  }
}

export async function updateTheme(id: string, theme: Partial<Theme>): Promise<Theme | null> {
  try {
    const { data, error } = await supabase.from("themes").update(theme).eq("id", id).select()

    if (error) {
      console.error("Error updating theme:", error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error updating theme:", error)
    return null
  }
}

export async function deleteTheme(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("themes").delete().eq("id", id)

    if (error) {
      console.error("Error deleting theme:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting theme:", error)
    return false
  }
}

export async function createSubmission(submission: Omit<Submission, "id" | "created_at">): Promise<Submission | null> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error("User not authenticated:", sessionError)
      throw new Error("User not authenticated")
    }

    const submissionWithUser = {
      ...submission,
      user_id: session.user.id,
    }

    const { data, error } = await supabase.from("submissions").insert([submissionWithUser]).select()

    if (error) {
      console.error("Error creating submission:", error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error creating submission:", error)
    return null
  }
}

export async function fetchSubmissions(): Promise<Submission[]> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        themes (
          title,
          icon
        ),
        user_profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions with themes:", error)

      // Fallback: fetch submissions without joins
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError)
        return []
      }

      return submissionsData || []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return []
  }
}

export async function fetchUserSubmissions(): Promise<Submission[]> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error("User not authenticated:", sessionError)
      return []
    }

    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        themes (
          title,
          icon
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user submissions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching user submissions:", error)
    return []
  }
}

export async function updateSubmissionStatus(
  id: string,
  status: "submitted" | "reviewed" | "winner",
  feedback?: string,
  score?: number,
): Promise<boolean> {
  try {
    const updateData: any = { status }
    if (feedback !== undefined) updateData.feedback = feedback
    if (score !== undefined) updateData.score = score

    const { error } = await supabase.from("submissions").update(updateData).eq("id", id)

    if (error) {
      console.error("Error updating submission status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating submission status:", error)
    return false
  }
}

// Legacy functions for backward compatibility
export async function fetchQuestions() {
  return []
}

export async function createQuestion() {
  return null
}

export async function updateQuestion() {
  return null
}

export async function deleteQuestion() {
  return false
}

export async function createEvaluation() {
  return null
}

export async function fetchEvaluations() {
  return []
}

export async function updateEvaluationStatus() {
  return false
}
