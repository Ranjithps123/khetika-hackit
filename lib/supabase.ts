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
  team_name?: string
  team_members?: string
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

      // Return default themes if database fetch fails
      return [
        {
          id: "1",
          title: "Logistics Optimization",
          description: "Route optimization and delivery efficiency solutions",
          icon: "🚚",
          difficulty: "hard" as const,
          prize_pool: 100000,
          max_teams: 20,
        },
        {
          id: "2",
          title: "Inventory Management",
          description: "Smart inventory planning and management systems",
          icon: "📦",
          difficulty: "medium" as const,
          prize_pool: 75000,
          max_teams: 25,
        },
        {
          id: "3",
          title: "Traceability of Products",
          description: "Track products through the entire supply chain",
          icon: "🔍",
          difficulty: "medium" as const,
          prize_pool: 80000,
          max_teams: 20,
        },
        {
          id: "4",
          title: "Smart Invoice & Document Extraction",
          description: "AI-powered document processing and extraction",
          icon: "🧾",
          difficulty: "hard" as const,
          prize_pool: 90000,
          max_teams: 15,
        },
        {
          id: "5",
          title: "Supply Chain Transparency",
          description: "End-to-end visibility and transparency solutions",
          icon: "🔍",
          difficulty: "hard" as const,
          prize_pool: 100000,
          max_teams: 15,
        },
        {
          id: "6",
          title: "Demand & Price Forecasting",
          description: "Predictive analytics for demand planning and pricing",
          icon: "📈",
          difficulty: "hard" as const,
          prize_pool: 125000,
          max_teams: 20,
        },
        {
          id: "7",
          title: "Admin Insights Dashboard",
          description: "Real-time analytics and reporting dashboards",
          icon: "📊",
          difficulty: "medium" as const,
          prize_pool: 75000,
          max_teams: 25,
        },
      ]
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

    // Get user profile to use for team_name
    let teamName = submission.team_name
    if (!teamName) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("full_name, email")
          .eq("id", session.user.id)
          .limit(1)

        if (profile && profile.length > 0) {
          teamName = profile[0].full_name || profile[0].email || "Individual Participant"
        } else {
          teamName = session.user.email || "Individual Participant"
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        teamName = session.user.email || "Individual Participant"
      }
    }

    // Create submission data WITHOUT user_id to avoid schema cache issues
    const submissionData = {
      team_name: teamName,
      team_members: submission.team_members || null,
      project_title: submission.project_title,
      project_description: submission.project_description,
      theme_id: submission.theme_id,
      application_url: submission.application_url || null,
      gitlab_url: submission.gitlab_url || null,
      pdf_file_name: submission.pdf_file_name || null,
      status: submission.status || "submitted",
      score: submission.score || 0,
      max_score: submission.max_score || 100,
      feedback: submission.feedback || null,
    }

    console.log("Creating submission with data:", submissionData)

    const { data, error } = await supabase.from("submissions").insert([submissionData]).select()

    if (error) {
      console.error("Error creating submission:", error)
      throw error
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error creating submission:", error)
    throw error
  }
}

export async function fetchSubmissions(): Promise<Submission[]> {
  try {
    // First try to fetch with joins
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        themes (
          title,
          icon
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

      // Manually add theme data for fallback
      const themes = await fetchThemes()
      const submissionsWithThemes = (submissionsData || []).map((submission) => ({
        ...submission,
        themes: themes.find((t) => t.id === submission.theme_id)
          ? {
              title: themes.find((t) => t.id === submission.theme_id)!.title,
              icon: themes.find((t) => t.id === submission.theme_id)!.icon,
            }
          : undefined,
      }))

      return submissionsWithThemes
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

    // Since user_id column doesn't exist, we'll fetch all submissions
    // and filter by team_name (which contains user info)
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        themes (
          title,
          icon
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user submissions:", error)

      // Fallback without joins
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })

      if (submissionsError) {
        console.error("Error fetching user submissions fallback:", submissionsError)
        return []
      }

      // Add theme data manually
      const themes = await fetchThemes()
      const submissionsWithThemes = (submissionsData || []).map((submission) => ({
        ...submission,
        themes: themes.find((t) => t.id === submission.theme_id)
          ? {
              title: themes.find((t) => t.id === submission.theme_id)!.title,
              icon: themes.find((t) => t.id === submission.theme_id)!.icon,
            }
          : undefined,
      }))

      return submissionsWithThemes
    }

    // Filter submissions by user email/name since we don't have user_id
    const userEmail = session.user.email
    const userSubmissions = (data || []).filter((submission) => {
      // Check if team_name contains user email or if it's the user's submission
      return (
        submission.team_name?.includes(userEmail || "") ||
        submission.team_name === (session.user.user_metadata?.full_name || userEmail)
      )
    })

    return userSubmissions
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
