"use client"

import QRGenerator from "@/components/qr-generator"

export default function TestQRPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Generator</h1>
          <p className="text-gray-600">Generate test QR codes for your Smart Bus Fare System</p>
        </div>

        <QRGenerator />
      </div>
    </div>
  )
}
