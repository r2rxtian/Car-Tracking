import { useEffect, useState } from 'react'
import type { LocationPoint, VehicleState } from '../types/tracking'

const UPDATE_INTERVAL = 2_000

// A north-to-south Metro Manila route. This array is the only mock-specific
// concern; UI components consume the stable VehicleState contract.
const ROUTE: ReadonlyArray<readonly [number, number]> = [
  [14.6511, 121.0497], [14.6464, 121.0465], [14.6406, 121.0428],
  [14.6342, 121.0391], [14.6285, 121.0348], [14.6217, 121.0307],
  [14.6152, 121.0265], [14.6085, 121.0224], [14.6018, 121.0188],
  [14.5954, 121.0147], [14.5887, 121.0108], [14.5819, 121.0069],
  [14.5752, 121.0037], [14.5689, 121.0001], [14.5619, 120.9965],
  [14.5547, 120.9927], [14.5481, 120.9892], [14.5415, 120.9851],
]

function bearingBetween(from: readonly [number, number], to: readonly [number, number]) {
  const lat1 = (from[0] * Math.PI) / 180
  const lat2 = (to[0] * Math.PI) / 180
  const deltaLng = ((to[1] - from[1]) * Math.PI) / 180
  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function createPoint(index: number, nextIndex: number): LocationPoint {
  const [lat, lng] = ROUTE[index]
  return {
    lat,
    lng,
    heading: Math.round(bearingBetween(ROUTE[index], ROUTE[nextIndex])),
    speed: Math.round(43 + Math.sin(index * 0.78) * 13 + (index % 3) * 2),
    timestamp: Date.now(),
  }
}

const initialPoint = createPoint(0, 1)

export function useMockLocationStream(): VehicleState {
  const [vehicle, setVehicle] = useState<VehicleState>({
    id: 'NCR-8421-X',
    status: 'active',
    currentLocation: initialPoint,
    history: [initialPoint],
  })

  useEffect(() => {
    let index = 0
    let direction: 1 | -1 = 1

    const timer = window.setInterval(() => {
      if (index >= ROUTE.length - 1) direction = -1
      if (index <= 0) direction = 1
      index += direction
      const nextIndex = Math.max(0, Math.min(ROUTE.length - 1, index + direction))
      const nextPoint = createPoint(index, nextIndex)

      setVehicle((previous) => ({
        ...previous,
        currentLocation: nextPoint,
        history: [...previous.history, nextPoint].slice(-120),
      }))
    }, UPDATE_INTERVAL)

    return () => window.clearInterval(timer)
  }, [])

  return vehicle
}
