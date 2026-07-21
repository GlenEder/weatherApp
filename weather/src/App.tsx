import { useState, useEffect, useCallback, useRef } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import { MapView } from './components/MapView'
import { OverlaySearchBar } from './components/OverlaySearchBar'
import { SearchInput } from './components/SearchInput'
import { WeatherCard } from './components/WeatherCard'
import { SameNameCityCards } from './components/SameNameCityCards'
import { ThemeToggle } from './components/ThemeToggle'
import { ErrorBoundary } from './components/ErrorBoundary'
import { fetchWeather, fetchSameNameLocations, fetchBatchWeather } from './api'
import type { Location, CurrentWeather, LocationWithWeather, RequestStatus } from './types'
import './App.css'

function App() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherStatus, setWeatherStatus] = useState<RequestStatus>('idle')
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [initialQuery, setInitialQuery] = useState('')
  const [sameNameCities, setSameNameCities] = useState<LocationWithWeather[]>([])
  const [sameNameLoading, setSameNameLoading] = useState(false)
  const sameNameRef = useRef<AbortController | null>(null)

  // Kick off a same-name lookup for the given location (called after fresh weather fetch)
  const loadSameNameCities = useCallback(async (loc: Location) => {
    if (sameNameRef.current) {
      sameNameRef.current.abort()
    }
    const controller = new AbortController()
    sameNameRef.current = controller

    setSameNameLoading(true)
    setSameNameCities([])

    try {
      const locations = await fetchSameNameLocations(loc.name, loc.id)
      if (controller.signal.aborted) return

      if (locations.length === 0) {
        setSameNameCities([])
        setSameNameLoading(false)
        return
      }

      const batch = await fetchBatchWeather(locations)
      if (controller.signal.aborted) return

      setSameNameCities(batch)
      setSameNameLoading(false)
    } catch {
      if (!controller.signal.aborted) {
        setSameNameCities([])
        setSameNameLoading(false)
      }
    }
  }, [])

  // Global key listener — any printable character opens search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Any single printable character opens search seeded with that character
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setInitialQuery(e.key)
        setOverlayOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = useCallback(async (loc: Location) => {
    setSelected(loc)
    setWeatherStatus('loading')
    setWeather(null)
    setWeatherError(null)
    setSameNameCities([])
    setSameNameLoading(false)
    try {
      const data = await fetchWeather(loc.latitude, loc.longitude)
      setWeather(data)
      setWeatherStatus('success')
      loadSameNameCities(loc)
    } catch {
      setWeatherError('Failed to load weather data.')
      setWeatherStatus('error')
    }
  }, [loadSameNameCities])

  // Rotate same-name cards in-memory — no API calls
  const handleSameNameSelect = (loc: Location) => {
    const entry = sameNameCities.find(c => c.location.id === loc.id)
    if (!entry || !selected || !weather) return

    const updated = sameNameCities
      .filter(c => c.location.id !== loc.id)
      .concat([{ location: selected, weather }])

    setSelected(loc)
    setWeather(entry.weather)
    setSameNameCities(updated)
    setWeatherStatus('success')
  }

  const handleCloseWeather = useCallback(() => {
    setWeather(null)
    setWeatherError(null)
    setWeatherStatus('idle')
    setSameNameCities([])
    setSameNameLoading(false)
  }, [])

  const handleCloseOverlay = useCallback(() => {
    setOverlayOpen(false)
  }, [])

  const handleSearchFocus = useCallback((query: string) => {
    setInitialQuery(query)
    setOverlayOpen(true)
  }, [])

  return (
    <ErrorBoundary>
      <div className="app-root">
        <MapView location={selected} />

        {weatherStatus === 'loading' && selected && (
          <Card
            elevation={4}
            sx={{
              position: 'fixed',
              bottom: 24,
              left: 24,
              zIndex: 1100,
              minWidth: 220,
              maxWidth: 300,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={100} height={48} sx={{ mt: 0.5 }} />
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={140} sx={{ mt: 1 }} />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Skeleton variant="text" width={50} />
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={55} />
              </Box>
            </CardContent>
          </Card>
        )}

        {weather && selected && (
          <WeatherCard
            location={selected}
            weather={weather}
            onClose={handleCloseWeather}
          />
        )}

        <SameNameCityCards
          cityName={selected?.name ?? ''}
          cities={sameNameCities}
          loading={sameNameLoading}
          onSelect={handleSameNameSelect}
        />

        {/* Inline search bar — click to open the overlay search panel */}
        <SearchInput
          placeholder="Begin typing to search…"
          showLabel={false}
          readOnly
          onFocus={() => setOverlayOpen(true)}
          onSubmit={handleSearchFocus}
          style={{
            position: 'fixed',
            top: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            margin: 0,
            maxWidth: 360,
          }}
        />

        <Snackbar
          open={!!weatherError}
          autoHideDuration={6000}
          onClose={() => setWeatherError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" variant="filled" onClose={() => setWeatherError(null)}>
            {weatherError}
          </Alert>
        </Snackbar>

        <OverlaySearchBar
          open={overlayOpen}
          initialQuery={initialQuery}
          onClose={handleCloseOverlay}
          onSelect={handleSelect}
        />

        <ThemeToggle />
      </div>
    </ErrorBoundary>
  )
}

export default App
