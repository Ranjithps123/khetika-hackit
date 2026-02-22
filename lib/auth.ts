// Re-export all Supabase functions and types from the main supabase module
export { supabase, type UserProfile } from "./supabase"

// Auth-specific functions
import { supabase } from "./supabase"

export async function signUp(email: string, password: string, fullName: string) {
  try {
    console.log("[v0] Attempting sign up with email:", email)
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
      console.log("[v0] Auth error:", error.message, error.status)
      throw error
    }

    console.log("[v0] Sign up successful")
    return data
  } catch (error: any) {
    console.error("[v0] Sign up exception:", error)
    
    // Handle network errors specifically
    if (error?.message?.includes("ENOTFOUND") || error?.cause?.code === "ENOTFOUND") {
      throw new Error("Supabase service is unreachable. This may be a temporary network issue. Please check your Supabase configuration and try again.")
    }
    
    throw new Error(error?.message || "Failed to sign up. Check your connection and try again.")
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log("[v0] Attempting sign in with email:", email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] Auth error:", error.message, error.status)
      throw error
    }

    console.log("[v0] Sign in successful")
    return data
  } catch (error: any) {
    console.error("[v0] Sign in exception:", error)
    
    // Handle network errors specifically
    if (error?.message?.includes("ENOTFOUND") || error?.cause?.code === "ENOTFOUND") {
      throw new Error("Supabase service is unreachable. This may be a temporary network issue. Please check your Supabase configuration and try again.")
    }
    
    throw new Error(error?.message || "Failed to sign in. Check your connection and try again.")
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

// Re-export profile functions
export { getUserProfile, updateUserProfile, makeUserAdmin, checkIsAdmin } from "./supabase"
