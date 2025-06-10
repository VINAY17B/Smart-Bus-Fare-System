"use client"

interface GPSPosition {
  lat: number
  lng: number
  timestamp: string
  accuracy?: number
}

interface GPSTrackerOptions {
  onLocationUpdate: (position: GPSPosition) => void
  onError: (error: string) => void
  updateInterval?: number // milliseconds
}

export class GPSTracker {
  private watchId: number | null = null
  private isTracking = false
  private options: GPSTrackerOptions
  private updateInterval: number

  constructor(options: GPSTrackerOptions) {
    this.options = options
    this.updateInterval = options.updateInterval || 10000 // Default 10 seconds
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      console.log("GPS tracking already active")
      return true
    }

    if (!navigator.geolocation) {
      this.options.onError("GPS not supported by this browser")
      return false
    }

    try {
      // Request permission first
      const permission = await navigator.permissions.query({ name: "geolocation" })

      if (permission.state === "denied") {
        this.options.onError("GPS permission denied")
        return false
      }

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const gpsPosition: GPSPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
          }

          console.log("GPS Update:", gpsPosition)
          this.options.onLocationUpdate(gpsPosition)
        },
        (error) => {
          console.error("GPS Error:", error)
          this.options.onError(`GPS Error: ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      )

      this.isTracking = true
      console.log("GPS tracking started")
      return true
    } catch (error) {
      console.error("Failed to start GPS tracking:", error)
      this.options.onError("Failed to start GPS tracking")
      return false
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.isTracking = false
    console.log("GPS tracking stopped")
  }

  isActive(): boolean {
    return this.isTracking
  }

  // Get current position once (for testing)
  async getCurrentPosition(): Promise<GPSPosition | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      )
    })
  }
}
