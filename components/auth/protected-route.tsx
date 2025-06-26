"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { useAuth } from "./auth-provider"
import { AuthModal } from "./auth-modal"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Set a timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 15000) // 15 second timeout

    return () => clearTimeout(timer)
  }, [])

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading authentication...</p>
          <p className="text-sm text-gray-500 mt-2">This should only take a moment</p>
        </div>
      </div>
    )
  }

  // If timeout reached and still loading, show auth modal
  if ((loading && timeoutReached) || !user) {
    return <AuthModal />
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
