// Enhanced distance utilities with GPS path calculation

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Number.parseFloat(distance.toFixed(3))
}

export function calculateFare(distance: number): number {
  const ratePerKm = 2
  const minimumFare = 5
  const calculatedFare = distance * ratePerKm
  return Math.max(calculatedFare, minimumFare)
}

// Calculate total distance from GPS path
export function calculatePathDistance(gpsPoints: Array<{ lat: number; lng: number }>): number {
  if (gpsPoints.length < 2) return 0

  let totalDistance = 0
  for (let i = 1; i < gpsPoints.length; i++) {
    const distance = calculateDistance(gpsPoints[i - 1].lat, gpsPoints[i - 1].lng, gpsPoints[i].lat, gpsPoints[i].lng)
    totalDistance += distance
  }

  return Number.parseFloat(totalDistance.toFixed(3))
}

// Filter GPS points to remove noise (points too close together)
export function filterGPSPoints(
  gpsPoints: Array<{ lat: number; lng: number; timestamp: string }>,
  minDistanceMeters = 10,
): Array<{ lat: number; lng: number; timestamp: string }> {
  if (gpsPoints.length <= 1) return gpsPoints

  const filtered = [gpsPoints[0]] // Always keep first point

  for (let i = 1; i < gpsPoints.length; i++) {
    const lastPoint = filtered[filtered.length - 1]
    const currentPoint = gpsPoints[i]

    const distance = calculateDistance(lastPoint.lat, lastPoint.lng, currentPoint.lat, currentPoint.lng)

    // Only keep points that are at least minDistanceMeters apart
    if (distance * 1000 >= minDistanceMeters) {
      filtered.push(currentPoint)
    }
  }

  return filtered
}
