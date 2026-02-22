import { signIn } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] API: Processing sign in request for:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const data = await signIn(email, password)
    console.log("[v0] API: Sign in successful")

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] API: Sign in error:", error.message)
    return NextResponse.json(
      { error: error.message || "Failed to sign in" },
      { status: 401 }
    )
  }
}
