"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, type UserProfile, getUserProfile } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Update the AuthProvider to properly fetch and check admin status
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Create immediate profile from user data
  const createImmediateProfile = (currentUser: User): UserProfile => {
    return {
      id: currentUser.id,
      email: currentUser.email || "",
      full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "",
      user_type: "user",
    }
  }

  const refreshProfile = async () => {
    if (user) {
      try {
        // Try to get full profile from database
        const fullProfile = await getUserProfile(user.id)
        if (fullProfile) {
          setProfile(fullProfile)
          setIsAdmin(fullProfile.user_type === "admin")
          console.log("Profile refreshed:", fullProfile.email, "Admin:", fullProfile.user_type === "admin")
        } else {
          // Fallback to immediate profile
          const immediateProfile = createImmediateProfile(user)
          setProfile(immediateProfile)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error refreshing profile:", error)
        // Fallback to immediate profile
        const immediateProfile = createImmediateProfile(user)
        setProfile(immediateProfile)
        setIsAdmin(false)
      }
    }
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Set a maximum timeout for auth initialization
    const initTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.error("Auth initialization timeout")
        setError("Authentication service is taking too long to respond")
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    const initializeAuth = async () => {
      try {
        // Check if Supabase is properly configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase configuration missing")
        }

        console.log("Initializing auth with Supabase URL:", supabaseUrl.substring(0, 30) + "...")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!mounted) return

        clearTimeout(initTimeout)

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError(`Authentication error: ${sessionError.message}`)
          setLoading(false)
          return
        }

        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          console.log("User authenticated:", currentUser.email)

          // Try to get full profile from database
          try {
            const fullProfile = await getUserProfile(currentUser.id)
            if (fullProfile) {
              setProfile(fullProfile)
              setIsAdmin(fullProfile.user_type === "admin")
              console.log("Full profile loaded:", fullProfile.email, "Admin:", fullProfile.user_type === "admin")
            } else {
              // Fallback to immediate profile
              const immediateProfile = createImmediateProfile(currentUser)
              setProfile(immediateProfile)
              setIsAdmin(false)
              console.log("Using immediate profile (no database profile found)")
            }
          } catch (error) {
            console.error("Error loading profile:", error)
            // Fallback to immediate profile
            const immediateProfile = createImmediateProfile(currentUser)
            setProfile(immediateProfile)
            setIsAdmin(false)
          }
        } else {
          console.log("No authenticated user")
          setIsAdmin(false)
        }

        setLoading(false)
      } catch (error: any) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setError(`Failed to initialize authentication: ${error.message}`)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event)

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // Try to get full profile from database
        try {
          const fullProfile = await getUserProfile(currentUser.id)
          if (fullProfile) {
            setProfile(fullProfile)
            setIsAdmin(fullProfile.user_type === "admin")
            console.log(
              "Profile loaded on auth change:",
              fullProfile.email,
              "Admin:",
              fullProfile.user_type === "admin",
            )
          } else {
            const immediateProfile = createImmediateProfile(currentUser)
            setProfile(immediateProfile)
            setIsAdmin(false)
          }
        } catch (error) {
          console.error("Error loading profile on auth change:", error)
          const immediateProfile = createImmediateProfile(currentUser)
          setProfile(immediateProfile)
          setIsAdmin(false)
        }
      } else {
        setProfile(null)
        setIsAdmin(false)
      }

      setError(null)
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(initTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setIsAdmin(false)
      setError(null)
    } catch (error: any) {
      console.error("Error signing out:", error)
      setError(`Sign out failed: ${error.message}`)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signOut: handleSignOut,
        refreshProfile,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
