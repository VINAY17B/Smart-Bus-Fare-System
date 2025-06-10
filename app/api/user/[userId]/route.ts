import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/data-store"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    console.log("Get user request:", userId)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user data
    const user = await getUser(userId)

    if (!user) {
      // Create new user if doesn't exist
      const newUser = {
        id: userId,
        name: `User ${userId.slice(0, 8)}`,
        balance: 500, // Starting balance
      }

      // In a real app, you'd save this to database
      // For now, return the new user data
      return NextResponse.json({
        ...newUser,
        currentTrip: null,
        tripHistory: [],
      })
    }

    // Get current trip and trip history (you'll need to implement these)
    const currentTrip = null // await getCurrentTrip(userId)
    const tripHistory = [] // await getTripHistory(userId)

    return NextResponse.json({
      id: user.id,
      name: user.name,
      balance: user.balance,
      currentTrip,
      tripHistory,
    })
  } catch (error) {
    console.error("Error getting user:", error)
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 })
  }
}
