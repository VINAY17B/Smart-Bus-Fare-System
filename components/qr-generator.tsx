"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Copy, Check } from "lucide-react"

interface Location {
  name: string
  lat: number
  lng: number
}

const testLocations: Location[] = [
  { name: "Bus Stop A - City Center", lat: 15.2993, lng: 74.124 },
  { name: "Bus Stop B - Mall", lat: 15.3173, lng: 74.124 },
  { name: "Bus Stop C - Hospital", lat: 15.3373, lng: 74.124 },
  { name: "Bus Stop D - University", lat: 15.3573, lng: 74.124 },
  { name: "Bus Stop E - Airport", lat: 15.3773, lng: 74.124 },
  { name: "Bus Stop F - Railway Station", lat: 15.3973, lng: 74.124 },
]

export default function QRGenerator() {
  const [selectedLocation, setSelectedLocation] = useState<Location>(testLocations[0])
  const [customLat, setCustomLat] = useState("")
  const [customLng, setCustomLng] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const generateQRData = (location: Location) => {
    return JSON.stringify({ lat: location.lat, lng: location.lng })
  }

  const generateQRCodeURL = (data: string) => {
    const encodedData = encodeURIComponent(data)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const downloadQR = (location: Location) => {
    const qrData = generateQRData(location)
    const qrURL = generateQRCodeURL(qrData)

    const link = document.createElement("a")
    link.href = qrURL
    link.download = `qr-${location.name.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCustomGenerate = () => {
    const lat = Number.parseFloat(customLat)
    const lng = Number.parseFloat(customLng)

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid latitude and longitude values")
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert("Please enter valid coordinate ranges (lat: -90 to 90, lng: -180 to 180)")
      return
    }

    setSelectedLocation({ name: "Custom Location", lat, lng })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator for Bus Stops</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predefined Locations */}
          <div>
            <h3 className="font-semibold mb-3">Test Bus Stops</h3>
            <div className="grid gap-3">
              {testLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-gray-500">
                      {location.lat}, {location.lng}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{generateQRData(location)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generateQRData(location), index)}
                    >
                      {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" onClick={() => downloadQR(location)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Location */}
          <div>
            <h3 className="font-semibold mb-3">Custom Location</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                step="any"
                placeholder="Latitude (e.g., 15.2993)"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g., 74.1240)"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <Button onClick={handleCustomGenerate} className="w-full">
              Generate Custom QR Code
            </Button>
          </div>

          {/* QR Code Preview */}
          <div className="text-center">
            <h3 className="font-semibold mb-3">QR Code Preview</h3>
            <div className="inline-block p-4 bg-white border rounded-lg">
              <img
                src={generateQRCodeURL(generateQRData(selectedLocation)) || "/placeholder.svg"}
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">{selectedLocation.name}</div>
            <div className="text-xs text-gray-500">{generateQRData(selectedLocation)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Scanning Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">QR Scanning Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Print QR codes on paper instead of showing on phone screens</li>
            <li>• Avoid reflections and glare from screens</li>
            <li>• Ensure good lighting but avoid direct bright light</li>
            <li>• Hold the camera steady and at proper distance</li>
            <li>• Use the manual input if scanning fails</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
