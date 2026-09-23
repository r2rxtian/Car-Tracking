import type { Server } from 'socket.io'
import type { ClientToServerEvents, LocationPoint, LocationReading, ServerToClientEvents, VehicleState } from './types.js'

const UPDATE_INTERVAL_MS = 2_000
const MAX_HISTORY_POINTS = 120
const VEHICLE_ID = 'NCR-8421-X'

const ROUTE: ReadonlyArray<readonly [number, number]> = [
  [14.6511, 121.0497], [14.6464, 121.0465], [14.6406, 121.0428],
  [14.6342, 121.0391], [14.6285, 121.0348], [14.6217, 121.0307],
  [14.6152, 121.0265], [14.6085, 121.0224], [14.6018, 121.0188],
  [14.5954, 121.0147], [14.5887, 121.0108], [14.5819, 121.0069],
  [14.5752, 121.0037], [14.5689, 121.0001], [14.5619, 120.9965],
  [14.5547, 120.9927], [14.5481, 120.9892], [14.5415, 120.9851],
]

function bearingBetween(from: readonly [number, number], to: readonly [number, number]) {
  const lat1 = from[0] * Math.PI / 180
  const lat2 = to[0] * Math.PI / 180
  const deltaLongitude = (to[1] - from[1]) * Math.PI / 180
  const y = Math.sin(deltaLongitude) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLongitude)
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

export class TrackingService {
  private readonly vehicles = new Map<string, VehicleState>()
  private routeIndex = 0
  private direction: 1 | -1 = 1
  private timer?: NodeJS.Timeout
  private receivingRealGps = false

  constructor(private readonly io: Server<ClientToServerEvents, ServerToClientEvents>) {
    const initialPoint = { ...createPoint(0, 1), speed: 0 }
    this.vehicles.set(VEHICLE_ID, {
      id: VEHICLE_ID,
      status: 'offline',
      currentLocation: initialPoint,
      history: [initialPoint],
    })
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.advanceVehicle(), UPDATE_INTERVAL_MS)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = undefined
  }

  getVehicle(vehicleId: string) {
    return this.vehicles.get(vehicleId)
  }

  getVehicles() {
    return Array.from(this.vehicles.values())
  }

  ingestLocation(reading: LocationReading) {
    if (!this.isValidReading(reading)) return false
    const previous = this.vehicles.get(reading.vehicleId)
    if (!previous) return false

    this.receivingRealGps = true
    const previousPoint = previous.currentLocation
    const heading = reading.heading ?? bearingBetween(
      [previousPoint.lat, previousPoint.lng],
      [reading.lat, reading.lng],
    )
    const nextPoint: LocationPoint = {
      lat: reading.lat,
      lng: reading.lng,
      heading: Number.isFinite(heading) ? Math.round(heading) : previousPoint.heading,
      speed: Math.max(0, Math.round(reading.speed ?? 0)),
      timestamp: reading.timestamp,
    }
    const nextVehicle: VehicleState = {
      ...previous,
      status: nextPoint.speed < 2 ? 'idle' : 'active',
      currentLocation: nextPoint,
      history: [...previous.history, nextPoint].slice(-MAX_HISTORY_POINTS),
    }
    this.vehicles.set(reading.vehicleId, nextVehicle)
    this.io.to(`vehicle:${reading.vehicleId}`).emit('vehicle:update', nextVehicle)
    return true
  }

  private isValidReading(reading: LocationReading) {
    return reading.vehicleId === VEHICLE_ID
      && Number.isFinite(reading.lat)
      && Number.isFinite(reading.lng)
      && reading.lat >= 4.5 && reading.lat <= 21.5
      && reading.lng >= 116.5 && reading.lng <= 127
      && Number.isFinite(reading.accuracy)
      && reading.accuracy > 0 && reading.accuracy <= 500
      && Number.isFinite(reading.timestamp)
      && Math.abs(Date.now() - reading.timestamp) < 60_000
      && (reading.speed === null || (Number.isFinite(reading.speed) && reading.speed >= 0 && reading.speed <= 300))
      && (reading.heading === null || (Number.isFinite(reading.heading) && reading.heading >= 0 && reading.heading <= 360))
  }

  private advanceVehicle() {
    if (this.receivingRealGps) return
    if (this.routeIndex >= ROUTE.length - 1) this.direction = -1
    if (this.routeIndex <= 0) this.direction = 1
    this.routeIndex += this.direction

    const nextIndex = Math.max(0, Math.min(ROUTE.length - 1, this.routeIndex + this.direction))
    const nextPoint = createPoint(this.routeIndex, nextIndex)
    const previous = this.vehicles.get(VEHICLE_ID)
    if (!previous) return

    const nextVehicle: VehicleState = {
      ...previous,
      status: 'active',
      currentLocation: nextPoint,
      history: [...previous.history, nextPoint].slice(-MAX_HISTORY_POINTS),
    }
    this.vehicles.set(VEHICLE_ID, nextVehicle)
    this.io.to(`vehicle:${VEHICLE_ID}`).emit('vehicle:update', nextVehicle)
  }
}
