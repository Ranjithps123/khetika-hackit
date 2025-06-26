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
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user profile:", error)
    return null
  }

  return data
}

export async function makeUserAdmin(userId: string): Promise<boolean> {
  const { error } = await supabase.from("user_profiles").update({ user_type: "admin" }).eq("id", userId)

  if (error) {
    console.error("Error making user admin:", error)
    return false
  }

  return true
}
