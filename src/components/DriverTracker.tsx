import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LocateFixed, Radio, ShieldCheck, Square } from 'lucide-react'
import { io, type Socket } from 'socket.io-client'

const TRACKING_SERVER_URL = import.meta.env.VITE_TRACKING_SERVER_URL || undefined
const VEHICLE_ID = 'NCR-8421-X'

type TrackerStatus = 'ready' | 'connecting' | 'sharing' | 'error'

interface LiveReading {
  lat: number
  lng: number
  speed: number
  heading: number | null
  accuracy: number
  timestamp: number
}

export function DriverTracker() {
  const [status, setStatus] = useState<TrackerStatus>('ready')
  const [reading, setReading] = useState<LiveReading | null>(null)
  const [message, setMessage] = useState('Location is only shared after you press Start sharing.')
  const socketRef = useRef<Socket | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    socketRef.current?.disconnect()
  }, [])

  const stopSharing = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
    socketRef.current?.disconnect()
    socketRef.current = null
    setStatus('ready')
    setMessage('Location sharing stopped.')
  }

  const startSharing = async () => {
    if (!window.isSecureContext) {
      setStatus('error')
      setMessage('GPS requires HTTPS when opened on a phone. Localhost is allowed for desktop testing.')
      return
    }
    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('This browser does not support GPS location.')
      return
    }

    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        if (permission.state === 'denied') {
          setStatus('error')
          setMessage('Location is blocked for this site. Use the location icon in the address bar or browser Site settings to change it to Allow, then reload this page.')
          return
        }
        if (permission.state === 'prompt') {
          setMessage('Approve the browser location prompt. If it is hidden, check the location icon in the address bar.')
        }
      } catch {
        // Some browsers expose geolocation without supporting Permissions API queries.
      }
    }

    setStatus('connecting')
    setMessage('Waiting for GPS permission and an accurate position. Check the location icon in the address bar if no prompt appears.')
    const socket = io(TRACKING_SERVER_URL, { transports: ['websocket'], reconnection: true })
    socketRef.current = socket
    socket.on('connect_error', () => {
      setStatus('error')
      setMessage('Cannot reach the tracking server. Check the server address and network.')
    })
    socket.on('location:accepted', () => {
      setStatus('sharing')
      setMessage('Live GPS is being sent to the operations dashboard.')
    })

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        // Browser speed is metres/second; the dashboard contract uses km/h.
        const speed = coords.speed === null ? 0 : Math.max(0, coords.speed * 3.6)
        const nextReading: LiveReading = {
          lat: coords.latitude,
          lng: coords.longitude,
          speed,
          heading: coords.heading,
          accuracy: coords.accuracy,
          timestamp,
        }
        setReading(nextReading)
        socket.emit('vehicle:location', { vehicleId: VEHICLE_ID, ...nextReading })
      },
      (error) => {
        setStatus('error')
        setMessage(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Enable it in browser settings and try again.'
          : 'GPS position is unavailable. Move outdoors and try again.')
      },
      { enableHighAccuracy: true, maximumAge: 1_000, timeout: 15_000 },
    )
  }

  const isActive = status === 'connecting' || status === 'sharing'

  return (
    <main className="driver-tracker">
      <div className="tracker-ambient" />
      <section className="tracker-card">
        <a href="/" className="tracker-back"><ArrowLeft size={15} /> Operations dashboard</a>
        <div className="tracker-icon"><LocateFixed size={28} /></div>
        <p className="eyebrow mt-7">Driver GPS transmitter</p>
        <h1>Share this vehicle’s live position.</h1>
        <p className="tracker-intro">Keep this page open while driving. Your phone sends GPS readings directly to your tracking server—no database or third-party API key.</p>

        <div className={`tracker-state tracker-state--${status}`}>
          <span className="tracker-pulse" />
          <div><strong>{status === 'sharing' ? 'GPS LIVE' : status.toUpperCase()}</strong><p>{message}</p></div>
        </div>

        {reading && (
          <dl className="tracker-metrics">
            <div><dt>Speed</dt><dd>{Math.round(reading.speed)} <small>km/h</small></dd></div>
            <div><dt>Accuracy</dt><dd>±{Math.round(reading.accuracy)} <small>m</small></dd></div>
            <div><dt>Latitude</dt><dd>{reading.lat.toFixed(6)}</dd></div>
            <div><dt>Longitude</dt><dd>{reading.lng.toFixed(6)}</dd></div>
          </dl>
        )}

        <button className={`tracker-action ${isActive ? 'is-stop' : ''}`} onClick={isActive ? stopSharing : startSharing}>
          {isActive ? <Square size={16} /> : <Radio size={17} />}
          {isActive ? 'Stop sharing' : 'Start sharing'}
        </button>
        <div className="tracker-privacy"><ShieldCheck size={14} /><span>Readings stay in server memory and disappear when the backend restarts.</span></div>
      </section>
    </main>
  )
}
