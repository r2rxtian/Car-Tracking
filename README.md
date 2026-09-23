# LIGTAS Fleet Operations

A frontend-only real-time vehicle tracking dashboard for the Philippines, built with Vite, React, TypeScript, Tailwind CSS, and Leaflet.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The command runs both the React client and the in-memory tracking API. The vehicle remains stationary and offline until the driver transmitter sends a real GPS reading.

To demonstrate movement without a phone, set `ENABLE_SIMULATOR=true` in `.env`. Simulation is disabled by default so demo coordinates can never be mistaken for real travel.

## Real phone GPS

Open `/tracker` on the driver's phone and press **Start sharing**. The browser requests high-accuracy location permission and streams accepted readings to the backend. The first valid real GPS reading stops the simulator for the rest of that server session.

Browser geolocation requires a secure context. `localhost` works for testing on the same device, but a phone connecting over your LAN needs the frontend served over HTTPS. In production, proxy `/socket.io` to the Node backend on the same HTTPS origin or set `VITE_TRACKING_SERVER_URL` to the public HTTPS backend URL.

The API runs at `http://localhost:3001` and provides:

- `GET /api/health`
- `GET /api/vehicles`
- `GET /api/vehicles/NCR-8421-X`
- Socket.IO event `vehicle:update`

## Production check

```bash
npm run build
npm run build:server
npm run preview
```

The UI consumes the `VehicleState` contract from `src/types/tracking.ts`. The backend currently stores the latest state and the last 120 breadcrumb points in an in-memory `Map`. Restarting the server clears this information. A database can later be introduced inside `TrackingService` without changing the map or telemetry components.

Use the camera toggle to switch between a North-Up overview and a heading-up driver-follow view. Follow mode locks interaction, zooms to street level, smoothly tracks a point ahead of the vehicle, and rotates the map beneath the fixed HUD so the vehicle remains pointed toward the top of the screen.

The map is hard-constrained to the Philippines bounds `[4.5, 116.5]` to `[21.5, 127.0]`. It uses the key-free OpenStreetMap raster endpoint with a client-side dark treatment. Keep the visible attribution and comply with the OpenStreetMap tile usage policy. For high-traffic production deployments, use a dedicated provider or self-hosted tiles.
