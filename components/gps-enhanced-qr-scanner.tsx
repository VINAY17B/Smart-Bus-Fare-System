
"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { X, Camera, Upload, Edit3, AlertCircle, CheckCircle, Navigation } from "lucide-react"
import { GPSTracker } from "@/lib/gps-tracker"

interface QRScannerProps {
  onScan: (result: string, gpsLocation?: { lat: number; lng: number }) => void
  onClose: () => void
  tripMode: "start" | "end"
}

type ScanMode = "camera" | "upload" | "manual"

interface GPSPosition {
  lat: number
  lng: number
  timestamp: string
  accuracy?: number
}

export default function GPSEnhancedQRScanner({ onScan, onClose, tripMode }: QRScannerProps) {
  const [scanMode, setScanMode] = useState<ScanMode>("upload")
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // GPS related state
  const [gpsLocation, setGpsLocation] = useState<GPSPosition | null>(null)
  const [gpsError, setGpsError] = useState<string>("")
  const [gpsPermission, setGpsPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown")

  const html5QrCode = useRef<Html5Qrcode | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gpsTracker = useRef<GPSTracker | null>(null)
  const isMounted = useRef(true)

  // Initialize GPS on component mount
  useEffect(() => {
    checkGPSPermission()
    getCurrentGPSLocation()

    return () => {
      isMounted.current = false
      if (gpsTracker.current) {
        gpsTracker.current.stopTracking()
      }
    }
  }, [])

  const checkGPSPermission = async () => {
    if (!navigator.permissions) {
      setGpsPermission("unknown")
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: "geolocation" })
      setGpsPermission(permission.state)
    } catch (error) {
      console.error("Error checking GPS permission:", error)
      setGpsPermission("unknown")
    }
  }

  const getCurrentGPSLocation = async () => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported by this browser")
      return
    }

    try {
      const tracker = new GPSTracker({
        onLocationUpdate: (position) => {
          setGpsLocation(position)
          setGpsError("")
        },
        onError: (error) => {
          setGpsError(error)
        },
      })

      const currentPosition = await tracker.getCurrentPosition()
      if (currentPosition) {
        setGpsLocation(currentPosition)
        setGpsError("")
      }
    } catch (error) {
      console.error("GPS Error:", error)
      setGpsError("Could not get GPS location")
    }
  }

  // Cleanup function
  const cleanup = async () => {
    try {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        await html5QrCode.current.stop()
      }
      if (scannerRef.current) {
        await scannerRef.current.clear()
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    html5QrCode.current = null
    scannerRef.current = null
  }

  // Initialize camera scanner
  useEffect(() => {
    if (scanMode !== "camera") return

    isMounted.current = true

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
    }

    const scanner = new Html5QrcodeScanner("qr-reader-camera", config, false)
    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        console.log("QR Code detected:", decodedText)
        handleQRResult(decodedText)
      },
      (error) => {
        if (!error.includes("NotFoundException") && !error.includes("No QR code found")) {
          console.log("QR scan error:", error)
        }
      },
    )

    setIsScanning(true)

    return () => {
      isMounted.current = false
      cleanup()
    }
  }, [scanMode])

  // Handle QR result validation
  const handleQRResult = (decodedText: string) => {
    try {
      const parsed = JSON.parse(decodedText)
      if (parsed.lat && parsed.lng && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        setError("")
        setSuccess("✓ Valid QR code detected!")

        setTimeout(() => {
          cleanup().then(() => {
            // Pass both QR location and user's GPS location
            onScan(decodedText, gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : undefined)
          })
        }, 1000)
      } else {
        setError("QR code must contain valid 'lat' and 'lng' number properties")
      }
    } catch (e) {
      setError("QR code must contain valid JSON with lat/lng coordinates")
    }
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setError("")
    setSuccess("")

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file")
      const result = await html5QrCode.scanFile(file, true)
      console.log("File QR scan result:", result)
      handleQRResult(result)
    } catch (error) {
      console.error("File scan error:", error)
      setError("Could not read QR code from this image. Try a clearer image or use manual entry.")
    }
  }

  // Handle manual input
  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setError("Please enter coordinates")
      return
    }

    try {
      const parsed = JSON.parse(manualInput.trim())
      if (parsed.lat && parsed.lng) {
        handleQRResult(manualInput.trim())
        return
      }
    } catch (e) {
      const coords = manualInput.trim().split(",")
      if (coords.length === 2) {
        const lat = Number.parseFloat(coords[0].trim())
        const lng = Number.parseFloat(coords[1].trim())

        if (!isNaN(lat) && !isNaN(lng)) {
          const jsonFormat = JSON.stringify({ lat, lng })
          handleQRResult(jsonFormat)
          return
        }
      }
    }

    setError("Please enter valid coordinates in JSON format or as 'lat,lng'")
  }

  const handleClose = () => {
    cleanup().then(() => {
      onClose()
    })
  }

  const handleModeChange = (mode: ScanMode) => {
    cleanup().then(() => {
      setScanMode(mode)
      setError("")
      setSuccess("")
      setUploadedFile(null)
      setManualInput("")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-medium">{tripMode === "start" ? "Scan QR to Start Trip" : "Scan QR to End Trip"}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* GPS Status */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">GPS Status</span>
        </div>

        {gpsLocation ? (
          <div className="text-xs text-blue-800 space-y-1">
            <div>
              ✓ Location: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
            </div>
            <div>✓ Accuracy: {gpsLocation.accuracy ? `${Math.round(gpsLocation.accuracy)}m` : "Unknown"}</div>
            <div className="text-green-600 font-medium">
              {tripMode === "start" ? "Ready to start GPS tracking" : "GPS location captured for trip end"}
            </div>
          </div>
        ) : (
          <div className="text-xs text-red-800">{gpsError || "Getting GPS location..."}</div>
        )}
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={scanMode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange("upload")}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <Button
          variant={scanMode === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange("camera")}
          className="flex items-center gap-1"
        >
          <Camera className="h-4 w-4" />
          Camera
        </Button>
        <Button
          variant={scanMode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange("manual")}
          className="flex items-center gap-1"
        >
          <Edit3 className="h-4 w-4" />
          Manual
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Upload Mode */}
      {scanMode === "upload" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Upload QR Code Image</p>
                <p className="text-xs text-gray-500">Select a QR code image from your device</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                Choose Image
              </Button>
            </div>
            {uploadedFile && <div className="mt-2 text-sm text-gray-600">Selected: {uploadedFile.name}</div>}
          </div>
        </div>
      )}

      {/* Camera Mode */}
      {scanMode === "camera" && (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden">
            <div id="qr-reader-camera" className="w-full min-h-[300px]"></div>
            <div id="qr-reader-file" className="hidden"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Position the QR code within the frame to scan</p>
            <p className="text-xs text-gray-500">Make sure the QR code is well-lit and clearly visible</p>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {scanMode === "manual" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter Coordinates</label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={`Enter in any of these formats:
{"lat": 15.2993, "lng": 74.1240}
15.2993, 74.1240`}
              className="w-full p-3 border rounded-lg h-24 text-sm"
            />
          </div>
          <Button onClick={handleManualSubmit} className="w-full">
            Submit Coordinates
          </Button>
        </div>
      )}

      <Button variant="outline" onClick={handleClose} className="w-full">
        Cancel
      </Button>

      {/* Format Help */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer">GPS Enhanced Features</summary>
        <div className="mt-2 space-y-1">
          <div>✓ GPS location automatically captured</div>
          <div>✓ Real-time distance tracking during trip</div>
          <div>✓ Accurate fare calculation based on actual path</div>
          <div>✓ Works with QR codes, file upload, or manual entry</div>
        </div>
      </details>
    </div>
  )
}
