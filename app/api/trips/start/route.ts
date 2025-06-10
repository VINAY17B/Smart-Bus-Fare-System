import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createTrip, getCurrentTrip } from "@/lib/data-store"

export async function POST(request: NextRequest) {
  try {
    // Log the entire request body for debugging
    const body = await request.json()
    console.log("Start Trip Request (Full Body):", body)

    const { userId, location } = body

    // Detailed validation logging
    console.log("Validating trip start data:", {
      userId: userId ? "✓" : "✗",
      location: location ? "✓" : "✗",
      locationLat: location?.lat ? "✓" : "✗",
      locationLng: location?.lng ? "✓" : "✗",
    })

    if (!userId) {
      console.error("Missing userId")
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (!location) {
      console.error("Missing location")
      return NextResponse.json({ error: "Missing location" }, { status: 400 })
    }

    if (location.lat === undefined || location.lng === undefined) {
      console.error("Invalid location format:", location)
      return NextResponse.json({ error: "Location must have lat and lng properties" }, { status: 400 })
    }

    // Check if user already has an active trip
    console.log("Checking for existing trip for user:", userId)
    const existingTrip = await getCurrentTrip(userId)

    if (existingTrip) {
      console.error("Trip already in progress:", existingTrip)
      return NextResponse.json(
        {
          error: "Trip already in progress",
          tripId: existingTrip.id,
          tripStatus: existingTrip.status,
        },
        { status: 400 },
      )
    }

    // Create new trip with proper data validation
    const trip = {
      id: uuidv4(),
      userId,
      startLocation: {
        lat: Number(location.lat),
        lng: Number(location.lng),
      },
      startTime: new Date().toISOString(),
      status: "started" as const,
      // Initialize empty GPS path
      gpsPath: [],
      totalGPSDistance: 0,
    }

    console.log("Creating new trip:", trip)
    const createdTrip = await createTrip(trip)
    console.log("Trip created successfully:", createdTrip.id)

    return NextResponse.json(createdTrip)
  } catch (error) {
    console.error("Error starting trip:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: "Failed to start trip",
        details: errorMessage,
        ...(errorStack && { stack: errorStack }),
      },
      { status: 500 },
    )
  }
}
