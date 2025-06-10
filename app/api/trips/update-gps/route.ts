import { type NextRequest, NextResponse } from "next/server"
import { updateTrip, getTrip } from "@/lib/data-store"
import { calculatePathDistance, filterGPSPoints } from "@/lib/distance-utils"

export async function POST(request: NextRequest) {
  try {
    const { tripId, gpsLocation } = await request.json()
    console.log("GPS Update Request:", { tripId, gpsLocation })

    if (!tripId || !gpsLocation || !gpsLocation.lat || !gpsLocation.lng) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const trip = await getTrip(tripId)
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.status !== "started") {
      return NextResponse.json({ error: "Trip is not active" }, { status: 400 })
    }

    // Add new GPS point to path
    const newGPSPoint = {
      lat: Number.parseFloat(gpsLocation.lat.toString()),
      lng: Number.parseFloat(gpsLocation.lng.toString()),
      timestamp: new Date().toISOString(),
    }

    const updatedGPSPath = [...(trip.gpsPath || []), newGPSPoint]

    // Filter GPS points to remove noise (points too close together)
    const filteredPath = filterGPSPoints(updatedGPSPath, 10) // 10 meters minimum distance

    // Calculate total distance from GPS path
    const totalGPSDistance = calculatePathDistance(filteredPath)

    // Update trip with new GPS data
    const updatedTrip = await updateTrip(tripId, {
      gpsPath: filteredPath,
      totalGPSDistance,
      lastGPSUpdate: new Date().toISOString(),
    })

    console.log(`GPS updated for trip ${tripId}. Total distance: ${totalGPSDistance} km`)

    return NextResponse.json({
      success: true,
      totalDistance: totalGPSDistance,
      pathPoints: filteredPath.length,
    })
  } catch (error) {
    console.error("Error updating GPS:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: "Failed to update GPS",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
