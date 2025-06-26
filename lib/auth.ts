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
    // Simple profile fetch without timeout - let Supabase handle its own timeouts
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      return createDefaultUserProfile(userId)
    }

    // If no profile found, create default
    if (!data) {
      console.log("No user profile found, creating default profile...")
      return createDefaultUserProfile(userId)
    }

    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return createDefaultUserProfile(userId)
  }
}

function createDefaultUserProfile(userId: string): UserProfile {
  // Return a simple default profile without trying to fetch user data or save to DB
  // This prevents cascading failures and timeouts
  return {
    id: userId,
    email: "",
    full_name: "",
    user_type: "user",
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
