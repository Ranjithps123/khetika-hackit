import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserProfile = {
  id: string
  email: string
  full_name?: string
  user_type: "user" | "admin"
  created_at?: string
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw error
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

// Simplified - no longer used in auth flow to prevent blocking
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log("Fetching user profile for:", userId)

    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    if (!data) {
      console.log("No profile found, creating one...")
      // Try to create a profile if it doesn't exist
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const newProfile = {
          id: userId,
          email: user.user.email || "",
          full_name: user.user.user_metadata?.full_name || "",
          user_type: "user" as const,
        }

        const { data: created, error: createError } = await supabase
          .from("user_profiles")
          .insert([newProfile])
          .select()
          .single()

        if (!createError && created) {
          console.log("Created new profile:", created)
          return created
        }
      }
      return null
    }

    console.log("Profile found:", data)
    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error updating user profile:", error)
    return null
  }
}

export async function makeUserAdmin(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_profiles").update({ user_type: "admin" }).eq("id", userId)

    if (error) {
      console.error("Error making user admin:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error making user admin:", error)
    return false
  }
}

// Add function to check if user is admin
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("user_profiles").select("user_type").eq("id", userId).single()

    if (error || !data) {
      console.log("No profile found for admin check")
      return false
    }

    const isAdmin = data.user_type === "admin"
    console.log("Admin check result:", isAdmin, "for user:", userId)
    return isAdmin
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
