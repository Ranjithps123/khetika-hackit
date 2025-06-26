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
  const [showTimeout, setShowTimeout] = useState(false)

  // Show timeout message after 10 seconds
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowTimeout(true)
      }, 10000)

      return () => clearTimeout(timer)
    } else {
      setShowTimeout(false)
    }
  }, [loading])

  // If loading for too long, show auth modal
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {showTimeout ? "Taking longer than expected..." : "Loading authentication..."}
          </p>
          {showTimeout && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-4">If this continues, please refresh the page</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
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
