export interface LocationPoint {
  lat: number
  lng: number
  heading: number
  speed: number
  timestamp: number
}

export interface VehicleState {
  id: string
  status: 'active' | 'idle' | 'offline'
  currentLocation: LocationPoint
  history: LocationPoint[]
}

export interface ServerToClientEvents {
  'vehicle:update': (vehicle: VehicleState) => void
  'location:accepted': (timestamp: number) => void
}

export interface ClientToServerEvents {
  'vehicle:subscribe': (vehicleId: string) => void
  'vehicle:location': (reading: LocationReading) => void
}

export interface LocationReading {
  vehicleId: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  accuracy: number
  timestamp: number
}
