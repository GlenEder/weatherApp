import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from '../hooks/useMap'
import { useColorMode } from '../ColorModeContext'
import type { Location } from '../types'

interface MapViewProps {
  location: Location | null
}

const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const SELECTED_ZOOM = 11

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c] ?? c)
}

export function MapView({ location }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { mapRef, setDarkMode } = useMap(containerRef, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM })
  const markerRef = useRef<L.Marker | null>(null)
  const { mode } = useColorMode()

  // Swap tile layer when mode changes
  useEffect(() => {
    setDarkMode(mode === 'dark')
  }, [mode, setDarkMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !location) return

    const latlng: L.LatLngTuple = [location.latitude, location.longitude]
    map.flyTo(latlng, SELECTED_ZOOM, { duration: 1.2 })

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng)
    } else {
      markerRef.current = L.marker(latlng).addTo(map)
    }

    const popup = `<b>${escapeHtml(location.name)}</b><br>${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
    markerRef.current.bindPopup(popup).openPopup()
  }, [location, mapRef])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
