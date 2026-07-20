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

  // Global key listener for / and Cmd+K to open search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        setOverlayOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = useCallback(async (loc: Location) => {
    setSelected(loc)
    setWeather(null)
    setWeatherError(null)
    try {
      const data = await fetchWeather(loc.latitude, loc.longitude)
      setWeather(data)
    } catch (err) {
      setWeatherError('Failed to load weather data.')
    }
  }, [])

  const handleCloseWeather = useCallback(() => {
    setWeather(null)
    setWeatherError(null)
  }, [])

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
        onClose={handleCloseOverlay}
        onSelect={handleSelect}
      />
    </div>
  )
}

export default App
