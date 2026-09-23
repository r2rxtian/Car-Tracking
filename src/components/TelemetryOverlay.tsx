import { Crosshair, Navigation } from 'lucide-react'
import type { VehicleState } from '../types/tracking'

interface TelemetryOverlayProps {
  vehicle: VehicleState
}

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const directionFor = (heading: number) => directions[Math.round(heading / 45) % 8]

function SpeedGauge({ speed }: { speed: number }) {
  const radius = 68
  const circumference = Math.PI * radius
  const progress = Math.min(speed / 120, 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-[225deg]" aria-hidden="true">
        <defs>
          <filter id="gaugeGlow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference * 2}`} />
        <circle className="speed-arc" cx="90" cy="90" r={radius} fill="none" stroke="#35f28b" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference * 2}`} strokeDashoffset={dashOffset} filter="url(#gaugeGlow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
        <span className="font-mono text-4xl font-semibold tracking-[-0.08em] text-white">{speed}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">km/h</span>
      </div>
    </div>
  )
}

export function TelemetryOverlay({ vehicle }: TelemetryOverlayProps) {
  const { currentLocation: point } = vehicle
  return (
    <aside className="telemetry-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Tracked unit</p>
          <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.035em] text-white">{vehicle.id}</h1>
        </div>
        <span className="status-pill"><span className="status-dot" />{vehicle.status}</span>
      </div>

      <div className="my-5 h-px bg-white/[0.08]" />
      <p className="eyebrow mb-2">Live telemetry</p>
      <div className="flex items-center gap-4">
        <SpeedGauge speed={point.speed} />
        <div className="min-w-0">
          <Navigation size={17} className="mb-4 text-ops-amber" />
          <p className="text-xs text-zinc-500">Bearing</p>
          <p className="mt-1 whitespace-nowrap font-mono text-xl font-medium text-zinc-100">
            {Math.round(point.heading)}° <span className="text-ops-amber">{directionFor(point.heading)}</span>
          </p>
        </div>
      </div>

      <div className="mt-2 border-t border-white/[0.08] pt-5">
        <div className="flex gap-3">
          <Crosshair size={17} className="mt-0.5 shrink-0 text-zinc-500" />
          <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-xs">
            <dt className="text-zinc-500">Latitude</dt><dd className="text-right font-mono text-zinc-300">{point.lat.toFixed(5)}° N</dd>
            <dt className="text-zinc-500">Longitude</dt><dd className="text-right font-mono text-zinc-300">{point.lng.toFixed(5)}° E</dd>
          </dl>
        </div>
      </div>
    </aside>
  )
}
