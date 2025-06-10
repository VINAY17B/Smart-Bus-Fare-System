import { type NextRequest, NextResponse } from "next/server"
import { updateTrip, getTrip, updateUser, getUser } from "@/lib/data-store"
import { calculateDistance, calculateFare, calculatePathDistance } from "@/lib/distance-utils"

export async function POST(request: NextRequest) {
  try {
    // Log the entire request body for debugging
    const body = await request.json()
    console.log("End Trip Request (Full Body):", body)

    const { tripId, location, userGPSLocation } = body

    // Detailed validation logging
    console.log("Validating trip end data:", {
      tripId: tripId ? "✓" : "✗",
      location: location ? "✓" : "✗",
      locationLat: location?.lat ? "✓" : "✗",
      locationLng: location?.lng ? "✓" : "✗",
      userGPSLocation: userGPSLocation ? "✓" : "✗",
    })

    if (!tripId) {
      console.error("Missing tripId")
      return NextResponse.json({ error: "Missing tripId" }, { status: 400 })
    }

    if (!location) {
      console.error("Missing location")
      return NextResponse.json({ error: "Missing location" }, { status: 400 })
    }

    if (location.lat === undefined || location.lng === undefined) {
      console.error("Invalid location format:", location)
      return NextResponse.json({ error: "Location must have lat and lng properties" }, { status: 400 })
    }

    // Get trip details
    console.log("Fetching trip:", tripId)
    const trip = await getTrip(tripId)

    if (!trip) {
      console.error("Trip not found:", tripId)
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    console.log("Found trip:", {
      id: trip.id,
      status: trip.status,
      userId: trip.userId,
      startTime: trip.startTime,
    })

    if (trip.status !== "started") {
      console.error("Trip is not active. Current status:", trip.status)
      return NextResponse.json(
        {
          error: "Trip is not active",
          currentStatus: trip.status,
          tripId: trip.id,
        },
        { status: 400 },
      )
    }

    const endLocation = {
      lat: Number(location.lat),
      lng: Number(location.lng),
    }

    // Add user's actual GPS location when ending trip
    const userEndLocation = userGPSLocation
      ? {
          lat: Number(userGPSLocation.lat),
          lng: Number(userGPSLocation.lng),
          timestamp: new Date().toISOString(),
        }
      : null

    console.log("End location data:", {
      qrLocation: endLocation,
      userGPSLocation: userEndLocation,
    })

    // Calculate distances
    const straightLineDistance = calculateDistance(
      trip.startLocation.lat,
      trip.startLocation.lng,
      endLocation.lat,
      endLocation.lng,
    )

    // Use GPS path distance if available, otherwise use straight line
    let actualDistance = straightLineDistance
    let finalGPSPath = trip.gpsPath || []

    if (userGPSLocation && finalGPSPath.length > 0) {
      // Add final GPS point
      finalGPSPath = [
        ...finalGPSPath,
        {
          lat: Number(userGPSLocation.lat),
          lng: Number(userGPSLocation.lng),
          timestamp: new Date().toISOString(),
        },
      ]
      actualDistance = calculatePathDistance(finalGPSPath)
    }

    console.log("Distance calculation:", {
      straightLineDistance,
      gpsPathDistance: actualDistance,
      gpsPoints: finalGPSPath.length,
      useGPSDistance: actualDistance !== straightLineDistance,
    })

    const fare = calculateFare(actualDistance)
    console.log("Calculated fare:", fare)

    // Check if user has sufficient balance
    console.log("Fetching user:", trip.userId)
    const user = await getUser(trip.userId)

    if (!user) {
      console.error("User not found:", trip.userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User balance check:", {
      currentBalance: user.balance,
      fareRequired: fare,
      sufficient: user.balance >= fare,
    })

    if (user.balance < fare) {
      console.error("Insufficient balance:", { balance: user.balance, fare })
      return NextResponse.json(
        {
          error: "Insufficient balance",
          balance: user.balance,
          fareRequired: fare,
        },
        { status: 400 },
      )
    }

    // Prepare trip update data
    const tripUpdateData = {
      endLocation,
      userEndLocation,
      endTime: new Date().toISOString(),
      distance: actualDistance,
      straightLineDistance,
      fare,
      status: "completed" as const,
      gpsPath: finalGPSPath,
      totalGPSDistance: actualDistance,
    }

    console.log("Updating trip with data:", tripUpdateData)

    // Update trip
    const updatedTrip = await updateTrip(tripId, tripUpdateData)

    if (!updatedTrip) {
      console.error("Failed to update trip - updateTrip returned null")
      return NextResponse.json(
        {
          error: "Failed to update trip",
          details: "Database update operation failed",
        },
        { status: 500 },
      )
    }

    console.log("Trip updated successfully:", {
      id: updatedTrip.id,
      status: updatedTrip.status,
      fare: updatedTrip.fare,
      distance: updatedTrip.distance,
    })

    // Update user balance
    console.log("Updating user balance:", {
      userId: trip.userId,
      oldBalance: user.balance,
      newBalance: user.balance - fare,
    })

    const updatedUser = await updateUser(trip.userId, {
      balance: user.balance - fare,
    })

    if (!updatedUser) {
      console.warn("Failed to update user balance, but trip was completed")
    }

    return NextResponse.json({
      ...updatedTrip,
      userBalance: updatedUser?.balance || user.balance - fare,
    })
  } catch (error) {
    console.error("Error ending trip:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: "Failed to end trip",
        details: errorMessage,
        ...(errorStack && { stack: errorStack }),
      },
      { status: 500 },
    )
  }
}
