# LIGTAS Fleet Operations

A frontend-only real-time vehicle tracking dashboard for the Philippines, built with Vite, React, TypeScript, Tailwind CSS, and Leaflet.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The command runs both the React client and the in-memory tracking API. The backend GPS simulator advances every two seconds and broadcasts each update over Socket.IO.

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

The map is hard-constrained to the Philippines bounds `[4.5, 116.5]` to `[21.5, 127.0]` and uses CARTO Dark Matter tiles. Production deployments should comply with CARTO and OpenStreetMap attribution requirements.
