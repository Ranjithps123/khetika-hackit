"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Trophy, Target, Clock, Presentation } from "lucide-react"

export function HackathonInfo() {
  const phases = [
    {
      phase: "Day 1",
      title: "Idea Submission",
      duration: "24 hours",
      description: "Submit your innovative idea with optional Proof of Concept",
      icon: "💡",
    },
    {
      phase: "Day 2-3",
      title: "Development & Evaluation",
      duration: "48 hours",
      description: "Build your solution while receiving daily feedback and updates",
      icon: "⚡",
    },
    {
      phase: "Day 4",
      title: "Final Showcase",
      duration: "5 minutes",
      description: "Present your application and explain implementation on Monday Daily Standup",
      icon: "🎯",
    },
  ]

  const themes = [
    { icon: "🚚", title: "Logistics Optimization", description: "Route optimization and delivery efficiency" },
    { icon: "📦", title: "Inventory Management", description: "Smart inventory planning and management" },
    { icon: "🔍", title: "Traceability of Products", description: "Track products through the supply chain" },
    { icon: "🧾", title: "Smart Invoice & Document Extraction", description: "AI-powered document processing" },
    { icon: "🔍", title: "Supply Chain Transparency", description: "End-to-end visibility and transparency" },
    { icon: "📈", title: "Demand & Price Forecasting", description: "Predictive analytics for demand planning" },
    { icon: "📊", title: "Admin Insights Dashboard", description: "Real-time analytics and reporting" },
  ]

  const judgingCriteria = [
    {
      title: "Innovation",
      description: "Uniqueness and creativity of the idea",
      weight: "25%",
      icon: "💡",
    },
    {
      title: "Business Impact",
      description: "Relevance and value to Khetika's supply chain challenges",
      weight: "25%",
      icon: "💼",
    },
    {
      title: "Feasibility",
      description: "Practicality of implementing the solution",
      weight: "20%",
      icon: "⚙️",
    },
    {
      title: "Technical Execution",
      description: "Clean code, working demo, scalability",
      weight: "20%",
      icon: "💻",
    },
    {
      title: "Presentation",
      description: "Clarity, storytelling, and explanation quality",
      weight: "10%",
      icon: "🎤",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Hackathon Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Duration</h3>
              <p className="text-gray-600">4 Days</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Participation</h3>
              <p className="text-gray-600">Individual</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Presentation className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">Final Showcase</h3>
              <p className="text-gray-600">Monday Standup</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hackathon Phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {phase.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {phase.phase}: {phase.title}
                    </h3>
                    <Badge variant="outline">{phase.duration}</Badge>
                  </div>
                  <p className="text-gray-600">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Who Can Participate?</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <Badge variant="secondary" className="justify-center py-2">
                👨‍💻 Engineers
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                📱 Product
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                🎨 Designers
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                ⚙️ Ops
              </Badge>
              <Badge variant="secondary" className="justify-center py-2">
                📊 Analysts
              </Badge>
            </div>
            <p className="text-blue-800 font-medium">
              🏆 Individual participation - showcase your unique skills and creativity!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Available Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{theme.icon}</span>
                  <h3 className="font-semibold">{theme.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Judging Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Judging Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {judgingCriteria.map((criteria, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mb-3">
                  <div className="text-3xl mb-3">{criteria.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{criteria.title}</h3>
                  <Badge variant="outline" className="mb-3">
                    {criteria.weight}
                  </Badge>
                  <p className="text-sm text-gray-600">{criteria.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Ready to Hack it? 🚀</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Choose your theme, build an innovative solution, and showcase your skills in this exciting 4-day hackathon.
            Individual participation means you get to shine and demonstrate your unique approach to solving Khetika's
            challenges!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="px-4 py-2">
              💡 Be Creative
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              ⚡ Build Fast
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              🎯 Present Well
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              🏆 Win Big
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
