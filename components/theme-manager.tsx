"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, Loader2, RefreshCw } from "lucide-react"
import {
  fetchThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  getThemesSync,
  preloadThemes,
  type Theme,
} from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

export default function ThemeManager() {
  const [themes, setThemes] = useState<Theme[]>(getThemesSync()) // Start with cached/default themes
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    // Preload themes in background
    preloadThemes()

    // Load fresh themes from database
    loadThemes()
  }, [])

  const loadThemes = async () => {
    setLoading(true)
    try {
      const data = await fetchThemes()
      setThemes(data)
      console.log("Themes loaded:", data.length)
    } catch (error) {
      console.error("Failed to load themes:", error)
      toast({
        title: "Warning",
        description: "Using default themes. Database connection may be slow.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createNewTheme = () => {
    const newTheme: Theme = {
      id: "",
      title: "",
      description: "",
      icon: "🚀",
      difficulty: "medium",
      prize_pool: 0,
      max_teams: 50,
    }
    setEditingTheme(newTheme)
    setIsCreating(true)
  }

  const saveTheme = async () => {
    if (!editingTheme) return

    setSaving(true)
    try {
      if (!editingTheme.title || !editingTheme.description) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      if (isCreating) {
        const result = await createTheme(editingTheme)
        if (result) {
          setThemes((prev) => [...prev, result])
          toast({
            title: "Success",
            description: "Theme created successfully.",
          })
        }
      } else {
        const result = await updateTheme(editingTheme.id, editingTheme)
        if (result) {
          setThemes((prev) => prev.map((t) => (t.id === result.id ? result : t)))
          toast({
            title: "Success",
            description: "Theme updated successfully.",
          })
        }
      }

      setEditingTheme(null)
      setIsCreating(false)
    } catch (error) {
      console.error("Failed to save theme:", error)
      toast({
        title: "Error",
        description: "Failed to save theme. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTheme = async (id: string) => {
    setDeleting(id)
    try {
      const success = await deleteTheme(id)
      if (success) {
        setThemes((prev) => prev.filter((t) => t.id !== id))
        toast({
          title: "Success",
          description: "Theme deleted successfully.",
        })
      }
    } catch (error) {
      console.error("Failed to delete theme:", error)
      toast({
        title: "Error",
        description: "Failed to delete theme. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const getDifficultyColor = (difficulty: Theme["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Hackathon Themes</h3>
          <p className="text-gray-600">Choose a theme that interests you and build innovative solutions</p>
          {loading && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600">Loading latest themes...</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadThemes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={createNewTheme}>
            <Plus className="h-4 w-4 mr-2" />
            Add Theme
          </Button>
        </div>
      </div>

      {editingTheme && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{isCreating ? "Create New Theme" : "Edit Theme"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Theme Title</Label>
                <Input
                  id="title"
                  value={editingTheme.title}
                  onChange={(e) => setEditingTheme((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  placeholder="Enter theme title"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={editingTheme.icon}
                  onChange={(e) => setEditingTheme((prev) => (prev ? { ...prev, icon: e.target.value } : null))}
                  placeholder="🚀"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingTheme.description}
                onChange={(e) => setEditingTheme((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                placeholder="Describe the theme and what participants should build"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={editingTheme.difficulty}
                  onChange={(e) =>
                    setEditingTheme((prev) =>
                      prev ? { ...prev, difficulty: e.target.value as Theme["difficulty"] } : null,
                    )
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <Label htmlFor="prize_pool">Prize Pool (₹)</Label>
                <Input
                  id="prize_pool"
                  type="number"
                  value={editingTheme.prize_pool}
                  onChange={(e) =>
                    setEditingTheme((prev) =>
                      prev ? { ...prev, prize_pool: Number.parseInt(e.target.value) || 0 } : null,
                    )
                  }
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="max_teams">Max Teams</Label>
                <Input
                  id="max_teams"
                  type="number"
                  value={editingTheme.max_teams}
                  onChange={(e) =>
                    setEditingTheme((prev) =>
                      prev ? { ...prev, max_teams: Number.parseInt(e.target.value) || 0 } : null,
                    )
                  }
                  placeholder="25"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveTheme} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Theme
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTheme(null)
                  setIsCreating(false)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <Card key={theme.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <h4 className="font-semibold text-lg">{theme.title}</h4>
                    <Badge className={getDifficultyColor(theme.difficulty)}>{theme.difficulty}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTheme(theme)
                      setIsCreating(false)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTheme(theme.id)}
                    disabled={deleting === theme.id}
                  >
                    {deleting === theme.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-sm leading-relaxed">{theme.description}</p>

              <div className="flex justify-between items-center text-sm">
                <Badge variant="outline">₹{theme.prize_pool.toLocaleString()}</Badge>
                <span className="text-gray-500">Max {theme.max_teams} teams</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {themes.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No themes available</p>
            <Button onClick={loadThemes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Loading Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
