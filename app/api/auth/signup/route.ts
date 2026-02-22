import { signUp } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    console.log("[v0] API: Processing sign up request for:", email)

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const data = await signUp(email, password, fullName)
    console.log("[v0] API: Sign up successful")

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] API: Sign up error:", error.message)
    return NextResponse.json(
      { error: error.message || "Failed to sign up" },
      { status: 400 }
    )
  }
}
