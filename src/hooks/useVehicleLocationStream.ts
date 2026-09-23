import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { VehicleState } from '../types/tracking'

const VEHICLE_ID = 'NCR-8421-X'
const TRACKING_SERVER_URL = import.meta.env.VITE_TRACKING_SERVER_URL || undefined

const initialLocation = {
  lat: 14.6511,
  lng: 121.0497,
  heading: 214,
  speed: 0,
  timestamp: Date.now(),
}

const initialVehicle: VehicleState = {
  id: VEHICLE_ID,
  status: 'offline',
  currentLocation: initialLocation,
  history: [initialLocation],
}

export function useVehicleLocationStream(): VehicleState {
  const [vehicle, setVehicle] = useState<VehicleState>(initialVehicle)

  useEffect(() => {
    const socket = io(TRACKING_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    })

    socket.on('connect', () => socket.emit('vehicle:subscribe', VEHICLE_ID))
    socket.on('vehicle:update', (nextVehicle: VehicleState) => setVehicle(nextVehicle))
    socket.on('disconnect', () => {
      setVehicle((previous) => ({ ...previous, status: 'offline', currentLocation: { ...previous.currentLocation, speed: 0 } }))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return vehicle
}
