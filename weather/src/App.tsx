import { useState, useEffect, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import { MapView } from './components/MapView'
import { OverlaySearchBar } from './components/OverlaySearchBar'
import { WeatherCard } from './components/WeatherCard'
import { ThemeToggle } from './components/ThemeToggle'
import { fetchWeather } from './api'
import type { Location, CurrentWeather } from './types'
import './App.css'

function App() {
  type WeatherStatus = 'idle' | 'loading' | 'success' | 'error'

  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('idle')
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [hintDismissed, setHintDismissed] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  // Dismiss the hint once search has been used
  const dismissHint = useCallback(() => {
    setHintDismissed(true)
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

      // Cmd+K / Ctrl+K opens empty search
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setInitialQuery('')
        setOverlayOpen(true)
        dismissHint()
        return
      }

      // Any single printable character opens search seeded with that character
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setInitialQuery(e.key)
        setOverlayOpen(true)
        dismissHint()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dismissHint])

  const handleSelect = useCallback(async (loc: Location) => {
    setSelected(loc)
    setWeatherStatus('loading')
    setWeather(null)
    setWeatherError(null)
    dismissHint()
    try {
      const data = await fetchWeather(loc.latitude, loc.longitude)
      setWeather(data)
      setWeatherStatus('success')
    } catch (err) {
      setWeatherError('Failed to load weather data.')
      setWeatherStatus('error')
    }
  }, [dismissHint])

  const handleCloseWeather = useCallback(() => {
    setWeather(null)
    setWeatherError(null)
    setWeatherStatus('idle')
  }, [])

  const handleOpenOverlay = useCallback(() => {
    setOverlayOpen(true)
    dismissHint()
  }, [dismissHint])

  const handleCloseOverlay = useCallback(() => {
    setOverlayOpen(false)
  }, [])

  return (
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

      <div
        className={`search-hint${hintDismissed ? ' hidden' : ''}`}
        onClick={handleOpenOverlay}
      >
        Type to search
      </div>

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
  )
}

export default App
