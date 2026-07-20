import { useState, useEffect, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { MapView } from './components/MapView'
import { OverlaySearchBar } from './components/OverlaySearchBar'
import { WeatherCard } from './components/WeatherCard'
import { fetchWeather } from './api'
import type { Location, CurrentWeather } from './types'
import './App.css'

function App() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selected, setSelected] = useState<Location | null>(null)
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
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
    setWeather(null)
    setWeatherError(null)
    dismissHint()
    try {
      const data = await fetchWeather(loc.latitude, loc.longitude)
      setWeather(data)
    } catch (err) {
      setWeatherError('Failed to load weather data.')
    }
  }, [dismissHint])

  const handleCloseWeather = useCallback(() => {
    setWeather(null)
    setWeatherError(null)
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
    </div>
  )
}

export default App
