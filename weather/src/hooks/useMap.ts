import { useEffect, useRef, type RefObject } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface UseMapOptions {
  center: [number, number]
  zoom?: number
}

export function useMap(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseMapOptions,
) {
  const mapRef = useRef<L.Map | null>(null)
  // Capture the initial options once; the map is created on mount only.
  const initialOptions = useRef(options)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: initialOptions.current.center,
      zoom: initialOptions.current.zoom ?? 10,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [containerRef])

  return mapRef
}
