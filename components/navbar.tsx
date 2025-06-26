"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Shield } from "lucide-react"
import { useAuth } from "./auth/auth-provider"

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()

  if (!user) return null

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Khetika Hackathon 2024
          </h1>
          {isAdmin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="font-medium">{profile?.full_name || user.email}</span>
          </div>

          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
