"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, getUserProfile, type UserProfile } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
      } catch (error) {
        console.error("Error refreshing profile:", error)
        // Set a basic default profile
        setProfile({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
          user_type: "user",
        })
      }
    }
  }

  const loadUserProfile = async (currentUser: User) => {
    try {
      // Set a basic profile immediately to prevent loading issues
      const basicProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || "",
        full_name: currentUser.user_metadata?.full_name || "",
        user_type: "user",
      }
      setProfile(basicProfile)

      // Try to fetch the full profile in the background
      const userProfile = await getUserProfile(currentUser.id)
      if (userProfile) {
        setProfile(userProfile)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      // Keep the basic profile we already set
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Error getting session:", error)
          setLoading(false)
          return
        }

        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          await loadUserProfile(currentUser)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.email)

      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
      }
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isAdmin = profile?.user_type === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signOut: handleSignOut,
        refreshProfile,
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
