"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, type UserProfile } from "@/lib/auth"

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
      // Just refresh with current user data - no database calls
      setProfile(createImmediateProfile(user))
    }
  }

  useEffect(() => {
    let mounted = true

    // Simplified session handling - no async profile loading
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          // Set profile immediately from user data
          setProfile(createImmediateProfile(currentUser))
        }

        setLoading(false)
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        setProfile(createImmediateProfile(currentUser))
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
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // For now, assume all users are regular users (not admin)
  // This can be enhanced later with proper admin detection
  const isAdmin = false

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
