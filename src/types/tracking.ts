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
