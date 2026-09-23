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
    iconSize: [54, 68],
    iconAnchor: [27, 34],
    html: `<div class="vehicle-icon-inner" style="transform:rotate(${heading}deg)">
      <svg viewBox="0 0 54 68" aria-hidden="true">
        <defs>
          <linearGradient id="suvBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff3c4"/>
            <stop offset=".38" stop-color="#f6b94a"/>
            <stop offset="1" stop-color="#b66b12"/>
          </linearGradient>
          <linearGradient id="suvGlass" x1="0" y1="0" x2="0" y2="1">
            <stop stop-color="#52605c"/>
            <stop offset="1" stop-color="#101614"/>
          </linearGradient>
        </defs>
        <ellipse cx="27" cy="36" rx="23" ry="29" fill="rgba(246,185,74,.12)"/>
        <g class="suv-shadow">
          <rect x="7" y="18" width="6" height="15" rx="2.5" fill="#080a09"/>
          <rect x="41" y="18" width="6" height="15" rx="2.5" fill="#080a09"/>
          <rect x="7" y="42" width="6" height="15" rx="2.5" fill="#080a09"/>
          <rect x="41" y="42" width="6" height="15" rx="2.5" fill="#080a09"/>
          <path d="M16 7.5C18 4.8 22 3 27 3s9 1.8 11 4.5l5 11v34.8c0 5.9-4.8 10.7-10.7 10.7H21.7C15.8 64 11 59.2 11 53.3V18.5Z" fill="url(#suvBody)" stroke="#fff1bd" stroke-width="1"/>
          <path d="m16 19 3.8-9.5h14.4L38 19l-3 6H19Z" fill="url(#suvGlass)" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>
          <path d="M18 27h18l2 20H16Z" fill="#222b28" stroke="rgba(255,255,255,.22)" stroke-width=".8"/>
          <path d="M27 27v20M17 38h20" stroke="rgba(246,185,74,.32)" stroke-width=".8"/>
          <path d="M16 49h22l-2 8H18Z" fill="#d99126"/>
          <path d="M17 8.5 14 17h4.5M37 8.5 40 17h-4.5" fill="none" stroke="#c9811f" stroke-width="1.1"/>
          <rect x="14.5" y="12" width="6.5" height="3" rx="1.5" fill="#fff8d9"/>
          <rect x="33" y="12" width="6.5" height="3" rx="1.5" fill="#fff8d9"/>
          <rect x="16" y="57" width="7" height="2.4" rx="1.2" fill="#ff5c3f"/>
          <rect x="31" y="57" width="7" height="2.4" rx="1.2" fill="#ff5c3f"/>
          <path d="M11 24 7.5 22v6L11 27M43 24l3.5-2v6L43 27" fill="#d99126" stroke="#fff1bd" stroke-width=".6"/>
          <path d="M20 6h14" stroke="rgba(255,255,255,.62)" stroke-width="1.2" stroke-linecap="round"/>
        </g>
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
