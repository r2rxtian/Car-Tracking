# LIGTAS Fleet Operations

A frontend-only real-time vehicle tracking dashboard for the Philippines, built with Vite, React, TypeScript, Tailwind CSS, and Leaflet.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The simulated GPS stream advances every two seconds along a Metro Manila route.

## Production check

```bash
npm run build
npm run preview
```

The UI consumes the `VehicleState` contract from `src/types/tracking.ts`. To connect a real Socket.io or WebSocket stream later, replace `useMockLocationStream` with a hook that returns the same shape; map and telemetry components do not need to change.

Use the camera toggle to switch between a North-Up overview and a heading-up driver-follow view. Follow mode locks interaction, zooms to street level, smoothly tracks a point ahead of the vehicle, and rotates the map beneath the fixed HUD so the vehicle remains pointed toward the top of the screen.

The map is hard-constrained to the Philippines bounds `[4.5, 116.5]` to `[21.5, 127.0]` and uses CARTO Dark Matter tiles. Production deployments should comply with CARTO and OpenStreetMap attribution requirements.
