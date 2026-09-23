import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { TrackingService } from './trackingService.js'
import type { ClientToServerEvents, ServerToClientEvents } from './types.js'

const PORT = Number(process.env.PORT ?? 3001)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
})
const tracking = new TrackingService(io)

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', persistence: 'memory', connectedClients: io.engine.clientsCount })
})

app.get('/api/vehicles', (_request, response) => {
  response.json(tracking.getVehicles())
})

app.get('/api/vehicles/:vehicleId', (request, response) => {
  const vehicle = tracking.getVehicle(request.params.vehicleId)
  if (!vehicle) return response.status(404).json({ error: 'Vehicle not found' })
  return response.json(vehicle)
})

io.on('connection', (socket) => {
  socket.on('vehicle:subscribe', (vehicleId) => {
    const vehicle = tracking.getVehicle(vehicleId)
    if (!vehicle) return
    socket.join(`vehicle:${vehicleId}`)
    socket.emit('vehicle:update', vehicle)
  })
})

httpServer.listen(PORT, () => {
  tracking.start()
  console.log(`Tracking API listening on http://localhost:${PORT}`)
})

function shutdown() {
  tracking.stop()
  io.close()
  httpServer.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
