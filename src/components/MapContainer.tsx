import { useEffect, useRef, useState } from 'react'
import { Map as MapIcon, Minus, Navigation2, Plus } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CompassWidget } from './CompassWidget'
import { TelemetryOverlay } from './TelemetryOverlay'
import type { VehicleState } from '../types/tracking'

const PHILIPPINES_BOUNDS = L.latLngBounds([4.5, 116.5], [21.5, 127.0])
const MANILA_CENTER: L.LatLngExpression = [14.5995, 120.9842]
type ViewMode = 'overview' | 'follow'

function destinationPoint(lat: number, lng: number, heading: number, distanceKm: number): L.LatLng {
  const angularDistance = distanceKm / 6371
  const bearing = heading * Math.PI / 180
  const latitude = lat * Math.PI / 180
  const longitude = lng * Math.PI / 180
  const nextLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance)
      + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
  )
  const nextLongitude = longitude + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(nextLatitude),
  )
  return L.latLng(nextLatitude * 180 / Math.PI, nextLongitude * 180 / Math.PI)
}

function vehicleIcon(heading: number) {
  return L.divIcon({
    className: 'tracking-vehicle',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    html: `<div class="vehicle-icon-inner" style="transform:rotate(${heading}deg)">
      <svg viewBox="0 0 46 46" aria-hidden="true">
        <circle cx="23" cy="23" r="20" fill="rgba(246,185,74,.12)" stroke="rgba(246,185,74,.22)"/>
        <path d="M23 7 33 34 23 29 13 34Z" fill="#f6b94a" stroke="#fff1bd" stroke-width="1.2"/>
        <path d="M23 12V27" stroke="#15160f" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>`,
  })
}

export function MapContainer({ vehicle }: { vehicle: VehicleState }) {
  const mapNode = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const trailRef = useRef<L.Polyline | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const point = vehicle.currentLocation

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return

    const map = L.map(mapNode.current, {
      center: MANILA_CENTER,
      zoom: 13,
      minZoom: 6,
      maxZoom: 19,
      maxBounds: PHILIPPINES_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      bounds: PHILIPPINES_BOUNDS,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map)

    trailRef.current = L.polyline([], { className: 'vehicle-trail', color: '#f6b94a', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }).addTo(map)
    markerRef.current = L.marker([point.lat, point.lng], { icon: vehicleIcon(point.heading), zIndexOffset: 1000 }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      trailRef.current = null
    }
  }, [])

  useEffect(() => {
    const marker = markerRef.current
    marker?.setLatLng([point.lat, point.lng])
    const markerGraphic = marker?.getElement()?.querySelector<HTMLElement>('.vehicle-icon-inner')
    if (markerGraphic) markerGraphic.style.transform = `rotate(${point.heading}deg)`
    trailRef.current?.setLatLngs(vehicle.history.map(({ lat, lng }) => [lat, lng]))

    if (viewMode === 'follow') {
      // Center slightly ahead of the vehicle so it rests in the lower third.
      const cameraTarget = destinationPoint(point.lat, point.lng, point.heading, 0.085)
      mapRef.current?.panTo(cameraTarget, { animate: true, duration: 1.8, easeLinearity: 0.16 })
    }
  }, [point, vehicle.history, viewMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (viewMode === 'follow') {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
      const cameraTarget = destinationPoint(point.lat, point.lng, point.heading, 0.085)
      map.setView(cameraTarget, 18, { animate: true, duration: 1.2 })
    } else {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
      map.setView(MANILA_CENTER, 13, { animate: true, duration: 1.2 })
    }
  }, [viewMode])

  const changeZoom = (delta: number) => {
    if (viewMode === 'follow') return
    mapRef.current?.setZoom(mapRef.current.getZoom() + delta, { animate: true })
  }

  return (
    <main className="relative h-full min-h-0 flex-1 overflow-hidden">
      <div
        className={`map-rotation-stage ${viewMode === 'follow' ? 'map-rotation-stage--follow' : ''}`}
        style={{ transform: viewMode === 'follow' ? `translate(-50%, -50%) rotate(${-point.heading}deg)` : 'translate(-50%, -50%) rotate(0deg)' }}
      >
        <div ref={mapNode} className="h-full w-full" aria-label="Live vehicle map of Metro Manila" />
      </div>
      <div className="map-vignette pointer-events-none absolute inset-0 z-[400]" />
      <div className="absolute left-5 top-5 z-[500] sm:left-8 sm:top-8"><TelemetryOverlay vehicle={vehicle} /></div>
      <div className="absolute right-5 top-5 z-[500] sm:right-8 sm:top-8"><CompassWidget heading={point.heading} /></div>
      <div className="view-mode-switch" role="group" aria-label="Map camera view">
        <button className={viewMode === 'overview' ? 'is-active' : ''} onClick={() => setViewMode('overview')} aria-pressed={viewMode === 'overview'}>
          <MapIcon size={14} /> <span>Overview</span>
        </button>
        <button className={viewMode === 'follow' ? 'is-active' : ''} onClick={() => setViewMode('follow')} aria-pressed={viewMode === 'follow'}>
          <Navigation2 size={14} /> <span>Driver follow</span>
        </button>
      </div>
      <div className={`map-zoom-controls ${viewMode === 'follow' ? 'is-disabled' : ''}`}>
        <button onClick={() => changeZoom(1)} disabled={viewMode === 'follow'} aria-label="Zoom in"><Plus size={18} /></button>
        <button onClick={() => changeZoom(-1)} disabled={viewMode === 'follow'} aria-label="Zoom out"><Minus size={18} /></button>
      </div>
      <div className="absolute bottom-5 left-5 z-[500] hidden items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:flex">
        <span className="h-px w-10 bg-zinc-500" /> Metro Manila · Philippines
      </div>
    </main>
  )
}
