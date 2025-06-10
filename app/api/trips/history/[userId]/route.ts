import { type NextRequest, NextResponse } from "next/server"
import { getUserTrips } from "@/lib/data-store"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const trips = await getUserTrips(userId)

    return NextResponse.json({
      trips,
      total: trips.length,
    })
  } catch (error) {
    console.error("Error fetching trip history:", error)
    return NextResponse.json({ error: "Failed to fetch trip history" }, { status: 500 })
  }
}
