"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, MapPin, Clock, IndianRupee, Navigation, Activity } from "lucide-react"
import GPSEnhancedQRScanner from "@/components/gps-enhanced-qr-scanner"
import GPSDebugPanel from "@/components/gps-debug-panel"
import { GPSTracker } from "@/lib/gps-tracker"
import { generateUserId, getUserId } from "@/lib/user-utils"

interface Trip {
  id: string
  userId: string
  startLocation: { lat: number; lng: number }
  endLocation?: { lat: number; lng: number }
  startTime: string
  endTime?: string
  distance?: number
  fare?: number
  status: "started" | "completed"
  gpsPath?: Array<{ lat: number; lng: number; timestamp: string }>
  totalGPSDistance?: number
}

interface GPSPosition {
  lat: number
  lng: number
  timestamp: string
  accuracy?: number
}

export default function HomePage() {
  const [userId, setUserId] = useState<string>("")
  const [balance, setBalance] = useState<number>(500)
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [tripHistory, setTripHistory] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // GPS tracking state
  const [currentGPS, setCurrentGPS] = useState<GPSPosition | null>(null)
  const [gpsError, setGpsError] = useState<string>("")
  const [isGPSTracking, setIsGPSTracking] = useState(false)
  const [tripDistance, setTripDistance] = useState<number>(0)

  const gpsTracker = useRef<GPSTracker | null>(null)

  useEffect(() => {
    // Initialize user ID
    let id = getUserId()
    if (!id) {
      id = generateUserId()
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", id)
      }
    }
    setUserId(id)

    // Load user data
    loadUserData(id)

    // Initialize GPS tracking
    initializeGPS()

    return () => {
      if (gpsTracker.current) {
        gpsTracker.current.stopTracking()
      }
    }
  }, [])

  const initializeGPS = () => {
    if (!gpsTracker.current) {
      gpsTracker.current = new GPSTracker({
        onLocationUpdate: (position) => {
          console.log("🛰️ GPS Update received:", position)
          setCurrentGPS(position)
          setGpsError("")

          // Update trip GPS data if trip is active
          if (currentTrip && currentTrip.status === "started") {
            console.log("📍 Updating trip GPS for active trip:", currentTrip.id)
            updateTripGPS(currentTrip.id, position)
          }
        },
        onError: (error) => {
          console.error("❌ GPS Error:", error)
          setGpsError(error)
        },
        updateInterval: 5000, // Update every 5 seconds for testing
      })
    }
  }

  const updateTripGPS = async (tripId: string, gpsPosition: GPSPosition) => {
    try {
      console.log("📡 Sending GPS update to server:", { tripId, gpsPosition })

      const response = await fetch("/api/trips/update-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          gpsLocation: {
            lat: gpsPosition.lat,
            lng: gpsPosition.lng,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ GPS update successful:", data)
        setTripDistance(data.totalDistance || 0)
      } else {
        console.error("❌ GPS update failed:", response.status)
      }
    } catch (error) {
      console.error("❌ Failed to update GPS:", error)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Loading user data for:", userId)

      const response = await fetch(`/api/user/${userId}`)
      console.log("User data response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("User data loaded:", data)

        setBalance(data.balance)
        setCurrentTrip(data.currentTrip)
        setTripHistory(data.tripHistory || [])

        // Start GPS tracking if there's an active trip
        if (data.currentTrip && data.currentTrip.status === "started") {
          console.log("🚀 Starting GPS tracking for existing trip")
          startGPSTracking()
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to load user data:", errorData)
        setError(`Failed to load user data: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(`Error loading user data: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startGPSTracking = async () => {
    if (gpsTracker.current && !isGPSTracking) {
      console.log("🛰️ Starting GPS tracking...")
      const started = await gpsTracker.current.startTracking()
      setIsGPSTracking(started)
      console.log("GPS tracking started:", started)
    }
  }

  const stopGPSTracking = () => {
    if (gpsTracker.current && isGPSTracking) {
      console.log("🛑 Stopping GPS tracking...")
      gpsTracker.current.stopTracking()
      setIsGPSTracking(false)
    }
  }

  const handleQRScan = async (result: string, userGPSLocation?: { lat: number; lng: number }) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("QR scan result:", result)
      console.log("User GPS location:", userGPSLocation)
      const locationData = JSON.parse(result)

      if (!currentTrip) {
        // Start new trip
        console.log("🚀 Starting new trip with QR location:", locationData)

        const response = await fetch("/api/trips/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            location: locationData,
            userGPSLocation,
          }),
        })

        const responseData = await response.json()

        if (response.ok) {
          console.log("✅ Trip started successfully:", responseData)
          setCurrentTrip(responseData)
          setShowScanner(false)
          setTripDistance(0)

          // Start GPS tracking for the trip
          await startGPSTracking()
        } else {
          console.error("❌ Failed to start trip:", responseData)
          setError(`Failed to start trip: ${responseData.error || response.statusText}`)
        }
      } else {
        // End current trip
        console.log("🏁 Ending trip with ID:", currentTrip.id)

        const response = await fetch("/api/trips/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: currentTrip.id,
            location: locationData,
            userGPSLocation,
          }),
        })

        const responseData = await response.json()

        if (response.ok) {
          console.log("✅ Trip ended successfully:", responseData)
          setCurrentTrip(null)
          setBalance(responseData.userBalance || balance - responseData.fare)
          setTripHistory((prev) => [responseData, ...prev])
          setShowScanner(false)
          setTripDistance(0)

          // Stop GPS tracking
          stopGPSTracking()
        } else {
          console.error("❌ Failed to end trip:", responseData)
          setError(`Failed to end trip: ${responseData.error || response.statusText}`)
        }
      }
    } catch (error) {
      console.error("❌ Failed to process QR scan:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(`Failed to process QR scan: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚍 Smart Bus Fare</h1>
          <p className="text-gray-600">GPS-Enhanced Journey Tracking</p>
        </div>

        {/* GPS Debug Panel */}
        <GPSDebugPanel
          currentGPS={currentGPS}
          isTracking={isGPSTracking}
          tripDistance={tripDistance}
          currentTrip={currentTrip}
        />

        {/* GPS Status */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-sm">
              <Navigation className="h-4 w-4" />
              GPS Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {currentGPS ? (
              <div className="space-y-1 text-xs text-blue-800">
                <div>📍 {formatLocation(currentGPS.lat, currentGPS.lng)}</div>
                <div>🎯 Accuracy: {currentGPS.accuracy ? `${Math.round(currentGPS.accuracy)}m` : "Unknown"}</div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {isGPSTracking ? "Tracking Active" : "Tracking Inactive"}
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-700">{gpsError || "Getting GPS location..."}</div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700 text-sm">{error}</div>
              <Button variant="outline" size="sm" onClick={() => setError(null)} className="mt-2">
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{balance}</div>
            <p className="text-sm text-gray-500 mt-1">User ID: {userId.slice(0, 8)}...</p>
          </CardContent>
        </Card>

        {/* Current Trip Status */}
        {currentTrip ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Clock className="h-5 w-5" />
                Trip in Progress
              </CardTitle>
              <CardDescription>Started at {new Date(currentTrip.startTime).toLocaleTimeString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>From: {formatLocation(currentTrip.startLocation.lat, currentTrip.startLocation.lng)}</span>
                </div>
                {tripDistance > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4" />
                    <span>Distance: {tripDistance.toFixed(3)} km</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Active Journey
                  </Badge>
                  {isGPSTracking && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      GPS Tracking
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* QR Scanner */}
        {showScanner ? (
          <Card>
            <CardHeader>
              <CardTitle>{currentTrip ? "Scan QR to End Trip" : "Scan QR to Start Trip"}</CardTitle>
            </CardHeader>
            <CardContent>
              <GPSEnhancedQRScanner
                onScan={handleQRScan}
                onClose={() => setShowScanner(false)}
                tripMode={currentTrip ? "end" : "start"}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={() => setShowScanner(true)} className="w-full h-16 text-lg" disabled={isLoading}>
                <QrCode className="mr-2 h-6 w-6" />
                {currentTrip ? "Scan QR to End Trip" : "Scan QR to Start Trip"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Trips */}
        {tripHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tripHistory.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{trip.distance?.toFixed(3)} km</div>
                      <div className="text-xs text-gray-500">{new Date(trip.startTime).toLocaleDateString()}</div>
                      {trip.totalGPSDistance && trip.totalGPSDistance !== trip.distance && (
                        <div className="text-xs text-blue-600">GPS: {trip.totalGPSDistance.toFixed(3)} km</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">-₹{trip.fare}</div>
                      <Badge variant="outline" className="text-xs">
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-green-900 mb-2">🧪 Testing GPS Tracking:</h3>
            <ol className="text-sm text-green-800 space-y-1">
              <li>1. 🔧 Open DevTools → Sensors tab</li>
              <li>2. 📍 Set custom GPS coordinates</li>
              <li>3. 🚀 Start a trip (GPS tracking begins)</li>
              <li>4. 🚶 Change GPS coordinates every 10 seconds</li>
              <li>5. 👀 Watch distance increase in real-time</li>
              <li>6. 🏁 End trip to see total GPS distance</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
