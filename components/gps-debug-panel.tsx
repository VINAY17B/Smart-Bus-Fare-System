"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface GPSDebugPanelProps {
  currentGPS: { lat: number; lng: number; timestamp: string; accuracy?: number } | null
  isTracking: boolean
  tripDistance: number
  currentTrip: any
}

export default function GPSDebugPanel({ currentGPS, isTracking, tripDistance, currentTrip }: GPSDebugPanelProps) {
  const [gpsHistory, setGpsHistory] = useState<Array<{ lat: number; lng: number; timestamp: string }>>([])

  useEffect(() => {
    if (currentGPS && isTracking) {
      setGpsHistory((prev) => [...prev.slice(-4), currentGPS]) // Keep last 5 positions
    }
  }, [currentGPS, isTracking])

  useEffect(() => {
    if (!currentTrip) {
      setGpsHistory([])
    }
  }, [currentTrip])

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900 text-sm">
          <Activity className="h-4 w-4" />
          GPS Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Current Status */}
        <div className="flex gap-2">
          <Badge variant={isTracking ? "default" : "secondary"}>{isTracking ? "🟢 Tracking" : "🔴 Inactive"}</Badge>
          {currentTrip && <Badge variant="outline">Trip: {currentTrip.id.slice(0, 8)}...</Badge>}
        </div>

        {/* Current Position */}
        {currentGPS && (
          <div className="text-xs space-y-1">
            <div className="font-medium text-purple-900">Current Position:</div>
            <div>
              📍 {currentGPS.lat.toFixed(6)}, {currentGPS.lng.toFixed(6)}
            </div>
            <div>🎯 Accuracy: {currentGPS.accuracy ? `${Math.round(currentGPS.accuracy)}m` : "Unknown"}</div>
            <div>⏰ {new Date(currentGPS.timestamp).toLocaleTimeString()}</div>
          </div>
        )}

        {/* Trip Distance */}
        {tripDistance > 0 && (
          <div className="text-xs">
            <div className="font-medium text-purple-900">Trip Distance:</div>
            <div>📏 {tripDistance.toFixed(3)} km</div>
          </div>
        )}

        {/* GPS History */}
        {gpsHistory.length > 0 && (
          <div className="text-xs">
            <div className="font-medium text-purple-900 mb-1">Recent Positions:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {gpsHistory.map((pos, index) => (
                <div key={index} className="flex justify-between text-purple-700">
                  <span>
                    {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
                  </span>
                  <span>{new Date(pos.timestamp).toLocaleTimeString().slice(-8)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-purple-700 border-t pt-2">
          <div className="font-medium mb-1">Testing Instructions:</div>
          <ol className="space-y-1">
            <li>1. Start a trip first</li>
            <li>2. Change GPS in DevTools</li>
            <li>3. Wait 10 seconds for update</li>
            <li>4. Watch distance increase</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
