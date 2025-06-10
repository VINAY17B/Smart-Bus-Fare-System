"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Route, IndianRupee } from "lucide-react"
import { getUserId } from "@/lib/user-utils"

interface Trip {
  id: string
  userId: string
  startLocation: { lat: number; lng: number }
  endLocation: { lat: number; lng: number }
  startTime: string
  endTime: string
  distance: number
  fare: number
  status: "completed"
}

export default function HistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTripHistory()
  }, [])

  const loadTripHistory = async () => {
    try {
      const userId = getUserId()
      if (!userId) return

      const response = await fetch(`/api/trips/history/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (error) {
      console.error("Failed to load trip history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 60000)
    return `${minutes} min`
  }

  const totalSpent = trips.reduce((sum, trip) => sum + trip.fare, 0)
  const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 py-6">
          <Button variant="ghost" size="icon" asChild>
            <a href="/">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
            <p className="text-gray-600">Your journey records</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{trips.length}</div>
                <div className="text-sm text-gray-500">Total Trips</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{totalSpent}</div>
                <div className="text-sm text-gray-500">Total Spent</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{totalDistance.toFixed(1)} km</div>
              <div className="text-sm text-gray-500">Total Distance</div>
            </div>
          </CardContent>
        </Card>

        {/* Trip List */}
        {trips.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-gray-500 mb-4">
                <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trips yet</p>
                <p className="text-sm">Start your first journey!</p>
              </div>
              <Button asChild>
                <a href="/">Start Trip</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card key={trip.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{new Date(trip.startTime).toLocaleDateString()}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {new Date(trip.startTime).toLocaleTimeString()} - {new Date(trip.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                        <div>
                          <div className="font-medium">From</div>
                          <div className="text-gray-600">
                            {formatLocation(trip.startLocation.lat, trip.startLocation.lng)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
                        <div>
                          <div className="font-medium">To</div>
                          <div className="text-gray-600">
                            {formatLocation(trip.endLocation.lat, trip.endLocation.lng)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Distance: </span>
                          <span className="font-medium">{trip.distance.toFixed(2)} km</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration: </span>
                          <span className="font-medium">{formatDuration(trip.startTime, trip.endTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-lg font-bold text-red-600">
                        <IndianRupee className="h-4 w-4" />
                        {trip.fare}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
