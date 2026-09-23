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
}

export interface ClientToServerEvents {
  'vehicle:subscribe': (vehicleId: string) => void
}
