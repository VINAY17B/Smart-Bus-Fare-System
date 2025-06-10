"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { X, Camera, Upload, Edit3, AlertCircle, CheckCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

type ScanMode = "camera" | "upload" | "manual"

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanMode, setScanMode] = useState<ScanMode>("upload")
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const html5QrCode = useRef<Html5Qrcode | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMounted = useRef(true)

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
            onScan(decodedText)
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
      // Create a temporary div for file scanning
      const tempDiv = document.createElement("div")
      tempDiv.id = "qr-reader-file-temp"
      tempDiv.style.display = "none"
      document.body.appendChild(tempDiv)

      const html5QrCode = new Html5Qrcode("qr-reader-file-temp")
      const result = await html5QrCode.scanFile(file, true)
      console.log("File QR scan result:", result)

      // Clean up temp div
      document.body.removeChild(tempDiv)

      handleQRResult(result)
    } catch (error) {
      console.error("File scan error:", error)
      setError("Could not read QR code from this image. Try a clearer image or use manual entry.")

      // Clean up temp div if it exists
      const tempDiv = document.getElementById("qr-reader-file-temp")
      if (tempDiv) {
        document.body.removeChild(tempDiv)
      }
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
          <span className="font-medium">QR Code Scanner</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
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
        <summary className="cursor-pointer">Supported Formats</summary>
        <div className="mt-2 space-y-1">
          <div>
            ✓ JSON: {"{"}"lat": 15.2993, "lng": 74.1240{"}"}
          </div>
          <div>✓ Comma-separated: 15.2993, 74.1240</div>
          <div>✓ QR code images (JPG, PNG, etc.)</div>
        </div>
      </details>
    </div>
  )
}
