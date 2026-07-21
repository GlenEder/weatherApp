import { useEffect, useRef, type RefObject } from 'react'
import L from 'leaflet'

interface UseMapOptions {
  center: [number, number]
  zoom?: number
}

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'

export function useMap(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseMapOptions,
) {
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  // Capture the initial options once; the map is created on mount only.
  const initialOptions = useRef(options)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: initialOptions.current.center,
      zoom: initialOptions.current.zoom ?? 10,
      zoomControl: true,
    })

    const tileLayer = L.tileLayer(TILE_URLS.light, {
      maxZoom: 20,
      attribution: ATTRIBUTION,
    }).addTo(map)

    tileLayerRef.current = tileLayer
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
    }
  }, [containerRef])

  function setDarkMode(dark: boolean) {
    const map = mapRef.current
    if (!map) return

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    const url = dark ? TILE_URLS.dark : TILE_URLS.light
    const newLayer = L.tileLayer(url, {
      maxZoom: 20,
      attribution: ATTRIBUTION,
    }).addTo(map)

    tileLayerRef.current = newLayer
  }

  return { mapRef, setDarkMode }
}
