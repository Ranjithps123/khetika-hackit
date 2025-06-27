"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, RefreshCw, Database } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { testStorageAccess } from "@/lib/storage"

export function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false)
  const [storageTest, setStorageTest] = useState<{ success: boolean; message: string } | null>(null)
  const [testingStorage, setTestingStorage] = useState(false)
  const { user, profile, loading, error, isAdmin } = useAuth()

  const handleTestStorage = async () => {
    setTestingStorage(true)
    try {
      const result = await testStorageAccess()
      setStorageTest(result)
    } catch (error: any) {
      setStorageTest({
        success: false,
        message: `Test failed: ${error.message}`,
      })
    } finally {
      setTestingStorage(false)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="bg-white shadow-lg">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Debug Info</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleTestStorage} disabled={testingStorage}>
                <Database className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Environment:</span>
            <Badge variant="outline">{process.env.NODE_ENV || "unknown"}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Supabase URL:</span>
            <Badge variant="outline">{process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗"}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Supabase Key:</span>
            <Badge variant="outline">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗"}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Auth Loading:</span>
            <Badge variant={loading ? "destructive" : "default"}>{loading ? "Yes" : "No"}</Badge>
          </div>

          <div className="flex justify-between">
            <span>User:</span>
            <Badge variant={user ? "default" : "secondary"}>{user ? "Authenticated" : "None"}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Profile:</span>
            <Badge variant={profile ? "default" : "secondary"}>{profile ? "Loaded" : "None"}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Admin Status:</span>
            <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Admin" : "User"}</Badge>
          </div>

          {profile && (
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <strong>Profile:</strong>
              <div className="text-xs mt-1">
                <div>Email: {profile.email}</div>
                <div>Name: {profile.full_name || "Not set"}</div>
                <div>Type: {profile.user_type}</div>
                <div>ID: {profile.id}</div>
              </div>
            </div>
          )}

          {storageTest && (
            <div
              className={`mt-2 p-2 rounded text-xs ${storageTest.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              <strong>Storage:</strong> {storageTest.message}
            </div>
          )}

          {error && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {user && (
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <strong>User Email:</strong> {user.email}
            </div>
          )}

          <div className="mt-2 text-gray-500">
            <strong>URL:</strong> {typeof window !== "undefined" ? window.location.href : "SSR"}
          </div>

          <div className="mt-2 text-xs text-gray-400">Click database icon to test storage</div>
        </CardContent>
      </Card>
    </div>
  )
}
