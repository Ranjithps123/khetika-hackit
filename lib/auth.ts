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

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // First, try to fetch the profile without .single() to handle multiple/no rows
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId)

    if (error) {
      console.error("Error fetching user profile:", error)

      // If the table doesn't exist, create a default profile
      if (error.code === "42P01") {
        console.log("User profiles table doesn't exist, creating default profile...")
        return await createDefaultUserProfile(userId)
      }

      return await createDefaultUserProfile(userId)
    }

    // Handle the response
    if (!data || data.length === 0) {
      console.log("No user profile found, creating default profile...")
      return await createDefaultUserProfile(userId)
    }

    // If multiple profiles exist, take the first one and clean up
    if (data.length > 1) {
      console.warn(`Multiple profiles found for user ${userId}, using the first one`)
      // Optionally, you could clean up duplicate profiles here
      return data[0]
    }

    return data[0]
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return await createDefaultUserProfile(userId)
  }
}

async function createDefaultUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Get user info from auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user for profile creation:", userError)
      // Return a basic default profile
      return {
        id: userId,
        email: "",
        full_name: "",
        user_type: "user",
      }
    }

    const defaultProfile: Omit<UserProfile, "created_at"> = {
      id: userId,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "",
      user_type: "user",
    }

    // Try to insert the profile with upsert to handle conflicts
    const { data, error } = await supabase.from("user_profiles").upsert([defaultProfile], { onConflict: "id" }).select()

    if (error) {
      console.error("Error creating default user profile:", error)
      // Return the default profile even if we can't save it
      return defaultProfile
    }

    return data?.[0] || defaultProfile
  } catch (error) {
    console.error("Error creating default user profile:", error)
    // Return a basic profile as fallback
    return {
      id: userId,
      email: "",
      full_name: "",
      user_type: "user",
    }
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId).select()

    if (error) {
      console.error("Error updating user profile:", error)
      return null
    }

    return data?.[0] || null
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
