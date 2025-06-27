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
  pdf_url?: string | null
  pdf_path?: string | null
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

// Default themes that load immediately
const DEFAULT_THEMES: Theme[] = [
  {
    id: "1",
    title: "Logistics Optimization",
    description: "Route optimization and delivery efficiency solutions",
    icon: "🚚",
    difficulty: "hard",
    prize_pool: 100000,
    max_teams: 20,
  },
  {
    id: "2",
    title: "Inventory Management",
    description: "Smart inventory planning and management systems",
    icon: "📦",
    difficulty: "medium",
    prize_pool: 75000,
    max_teams: 25,
  },
  {
    id: "3",
    title: "Traceability of Products",
    description: "Track products through the entire supply chain",
    icon: "🔍",
    difficulty: "medium",
    prize_pool: 80000,
    max_teams: 20,
  },
  {
    id: "4",
    title: "Smart Invoice & Document Extraction",
    description: "AI-powered document processing and extraction",
    icon: "🧾",
    difficulty: "hard",
    prize_pool: 90000,
    max_teams: 15,
  },
  {
    id: "5",
    title: "Supply Chain Transparency",
    description: "End-to-end visibility and transparency solutions",
    icon: "🔍",
    difficulty: "hard",
    prize_pool: 100000,
    max_teams: 15,
  },
  {
    id: "6",
    title: "Demand & Price Forecasting",
    description: "Predictive analytics for demand planning and pricing",
    icon: "📈",
    difficulty: "hard",
    prize_pool: 125000,
    max_teams: 20,
  },
  {
    id: "7",
    title: "Admin Insights Dashboard",
    description: "Real-time analytics and reporting dashboards",
    icon: "📊",
    difficulty: "medium",
    prize_pool: 75000,
    max_teams: 25,
  },
]

// Cache for themes
let themesCache: Theme[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchThemes(): Promise<Theme[]> {
  // Return cached themes if available and fresh
  if (themesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log("Returning cached themes")
    return themesCache
  }

  try {
    console.log("Fetching themes from database...")

    // Set a timeout for the database call
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Database timeout")), 3000)
    })

    const fetchPromise = supabase.from("themes").select("*").order("created_at", { ascending: false })

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

    if (error) {
      console.error("Error fetching themes from database:", error)
      console.log("Falling back to default themes")
      return DEFAULT_THEMES
    }

    if (data && data.length > 0) {
      console.log("Successfully fetched themes from database:", data.length)
      themesCache = data
      cacheTimestamp = Date.now()
      return data
    } else {
      console.log("No themes in database, using defaults")
      return DEFAULT_THEMES
    }
  } catch (error) {
    console.error("Error fetching themes:", error)
    console.log("Using default themes due to error")
    return DEFAULT_THEMES
  }
}

// Get themes immediately (synchronous) - returns defaults first
export function getThemesSync(): Theme[] {
  if (themesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return themesCache
  }
  return DEFAULT_THEMES
}

// Preload themes in background
export function preloadThemes(): void {
  if (!themesCache || Date.now() - cacheTimestamp >= CACHE_DURATION) {
    fetchThemes().catch(console.error)
  }
}

export async function createTheme(theme: Omit<Theme, "id" | "created_at">): Promise<Theme | null> {
  try {
    const { data, error } = await supabase.from("themes").insert([theme]).select()

    if (error) {
      console.error("Error creating theme:", error)
      return null
    }

    // Invalidate cache
    themesCache = null

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

    // Invalidate cache
    themesCache = null

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

    // Invalidate cache
    themesCache = null

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

    console.log("Creating submission for user:", session.user.id, session.user.email)

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
          teamName = profile[0].full_name || profile[0].email || session.user.email || "Individual Participant"
        } else {
          teamName = session.user.email || "Individual Participant"
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        teamName = session.user.email || "Individual Participant"
      }
    }

    // Ensure we have a valid team name
    if (!teamName || teamName.trim() === "") {
      teamName = session.user.email || "Individual Participant"
    }

    // Create submission data WITH user_id
    const submissionData = {
      user_id: session.user.id, // Include user_id
      team_name: teamName.trim(),
      team_members: submission.team_members || null,
      project_title: submission.project_title,
      project_description: submission.project_description,
      theme_id: submission.theme_id,
      application_url: submission.application_url || null,
      gitlab_url: submission.gitlab_url || null,
      pdf_file_name: submission.pdf_file_name || null,
      pdf_url: submission.pdf_url || null,
      pdf_path: submission.pdf_path || null,
      status: submission.status || "submitted",
      score: submission.score || 0,
      max_score: submission.max_score || 100,
      feedback: submission.feedback || null,
    }

    console.log("Creating submission with data:", submissionData)

    // Try to insert with user_id first
    const { data, error } = await supabase.from("submissions").insert([submissionData]).select()

    if (error) {
      console.error("Error creating submission with user_id:", error)

      // If user_id column doesn't exist, try without it as fallback
      if (error.code === "42703" || error.message?.includes("user_id")) {
        console.log("user_id column not found, trying without user_id...")

        const fallbackData = { ...submissionData }
        delete fallbackData.user_id

        const { data: fallbackResult, error: fallbackError } = await supabase
          .from("submissions")
          .insert([fallbackData])
          .select()

        if (fallbackError) {
          console.error("Error creating submission without user_id:", fallbackError)
          throw fallbackError
        }

        console.log("Submission created without user_id (fallback)")
        return fallbackResult?.[0] || null
      }

      throw error
    }

    console.log("Submission created successfully with user_id")
    return data?.[0] || null
  } catch (error) {
    console.error("Error creating submission:", error)
    throw error
  }
}

export async function updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
  try {
    const { data, error } = await supabase.from("submissions").update(updates).eq("id", id).select()

    if (error) {
      console.error("Error updating submission:", error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error updating submission:", error)
    return null
  }
}

export async function fetchSubmissions(): Promise<Submission[]> {
  try {
    console.log("Fetching all submissions...")

    // Fetch submissions without joins to avoid relationship errors
    const { data: submissionsData, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return []
    }

    console.log("Fetched submissions:", submissionsData?.length || 0)

    // Fetch themes separately
    const themes = await fetchThemes()
    const themeMap = new Map(themes.map((theme) => [theme.id, theme]))

    // Fetch user profiles separately for submissions that have user_id
    const userIds = submissionsData
      ?.filter((s) => s.user_id)
      .map((s) => s.user_id)
      .filter((id, index, arr) => arr.indexOf(id) === index) // unique user IDs

    let userProfilesMap = new Map()

    if (userIds && userIds.length > 0) {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, full_name, email")
          .in("id", userIds)

        if (!profilesError && profiles) {
          userProfilesMap = new Map(profiles.map((profile) => [profile.id, profile]))
          console.log("Fetched user profiles:", profiles.length)
        } else {
          console.log("Could not fetch user profiles:", profilesError)
        }
      } catch (error) {
        console.log("Error fetching user profiles:", error)
      }
    }

    // Combine the data
    const enrichedSubmissions = (submissionsData || []).map((submission) => ({
      ...submission,
      themes: themeMap.get(submission.theme_id)
        ? {
            title: themeMap.get(submission.theme_id)!.title,
            icon: themeMap.get(submission.theme_id)!.icon,
          }
        : undefined,
      user_profiles:
        submission.user_id && userProfilesMap.has(submission.user_id)
          ? {
              full_name: userProfilesMap.get(submission.user_id).full_name,
              email: userProfilesMap.get(submission.user_id).email,
            }
          : undefined,
    }))

    console.log("Enriched submissions with themes and profiles")
    return enrichedSubmissions
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

    console.log("Fetching user submissions for:", session.user.id, session.user.email)

    // First try to fetch by user_id if the column exists
    const { data: userIdSubmissions, error: userIdError } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (!userIdError && userIdSubmissions && userIdSubmissions.length > 0) {
      console.log("Fetched user submissions by user_id:", userIdSubmissions.length)

      // Enrich with theme data
      const themes = await fetchThemes()
      const themeMap = new Map(themes.map((theme) => [theme.id, theme]))

      const enrichedSubmissions = userIdSubmissions.map((submission) => ({
        ...submission,
        themes: themeMap.get(submission.theme_id)
          ? {
              title: themeMap.get(submission.theme_id)!.title,
              icon: themeMap.get(submission.theme_id)!.icon,
            }
          : undefined,
      }))

      return enrichedSubmissions
    }

    console.log("user_id query returned no results, falling back to team_name matching")

    // Fallback: Get user profile and match by team_name
    const userIdentifiers = [session.user.email]
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .limit(1)

      if (profile && profile.length > 0) {
        if (profile[0].full_name) userIdentifiers.push(profile[0].full_name)
        if (profile[0].email && !userIdentifiers.includes(profile[0].email)) {
          userIdentifiers.push(profile[0].email)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile for submissions:", error)
    }

    // Fetch all submissions and filter by user identifiers
    const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user submissions:", error)
      return []
    }

    // Filter submissions by user identifiers
    const userSubmissions = (data || []).filter((submission) => {
      return userIdentifiers.some(
        (identifier) => submission.team_name?.includes(identifier) || submission.team_name === identifier,
      )
    })

    // Enrich with theme data
    const themes = await fetchThemes()
    const themeMap = new Map(themes.map((theme) => [theme.id, theme]))

    const enrichedSubmissions = userSubmissions.map((submission) => ({
      ...submission,
      themes: themeMap.get(submission.theme_id)
        ? {
            title: themeMap.get(submission.theme_id)!.title,
            icon: themeMap.get(submission.theme_id)!.icon,
          }
        : undefined,
    }))

    console.log("Fetched user submissions by team_name matching:", enrichedSubmissions.length)
    return enrichedSubmissions
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
