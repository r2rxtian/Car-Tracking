import { Bell, LocateFixed, ShieldCheck } from 'lucide-react'
import { MapContainer } from './components/MapContainer'
import { DriverTracker } from './components/DriverTracker'
import { useVehicleLocationStream } from './hooks/useVehicleLocationStream'

function Header({ isGpsLive }: { isGpsLive: boolean }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#090b0a]/95 px-5 sm:px-8">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold tracking-[0.18em] text-zinc-50">LIGTAS</span>
        <span className="text-zinc-700">/</span>
        <span className="hidden text-xs uppercase tracking-[0.2em] text-zinc-500 sm:inline">Fleet operations</span>
      </div>
      <div className="flex items-center gap-5 text-xs text-zinc-400 sm:gap-7">
        <div className={`hidden items-center gap-2 uppercase tracking-[0.12em] sm:flex ${isGpsLive ? 'text-emerald-400' : 'text-zinc-500'}`}>
          <span className={isGpsLive ? 'status-dot' : 'h-[7px] w-[7px] rounded-full bg-zinc-600'} />
          {isGpsLive ? 'GPS live' : 'Waiting for GPS'}
        </div>
        <div className="hidden h-5 w-px bg-white/10 sm:block" />
        <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-zinc-500" /><span className="hidden sm:inline">PH Network</span></div>
        <button className="icon-button" aria-label="Notifications"><Bell size={16} /></button>
        <button className="icon-button" aria-label="Center tracked vehicle"><LocateFixed size={16} /></button>
      </div>
    </header>
  )
}

export default function App() {
  if (window.location.pathname === '/tracker') return <DriverTracker />
  const vehicle = useVehicleLocationStream()
  return <div className="flex h-dvh flex-col bg-ops-black"><Header isGpsLive={vehicle.status !== 'offline'} /><MapContainer vehicle={vehicle} /></div>
}
