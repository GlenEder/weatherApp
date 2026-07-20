import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { SearchBar } from './components/SearchBar'
import { LocationResults } from './components/LocationResults'
import { MapView } from './components/MapView'
import { ApiError, searchLocations, fetchWeather } from './api'
import type { Location, RequestStatus } from './types'
import './App.css'

function App() {
  const [term, setTerm] = useState('')
  const [matches, setMatches] = useState<Location[]>([])
  const [selected, setSelected] = useState<Location | null>(null)
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (value: string) => {
    setSelected(null)
    setError(null)
    const trimmed = value.trim()
    if (!trimmed) {
      setMatches([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    try {
      const results = await searchLocations(trimmed)
      setMatches(results)
      setStatus(results.length > 0 ? 'success' : 'empty')
    } catch (err) {
      setMatches([])
      setStatus('error')
      setError(
          err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    }
  }

  const handleSelect = async (loc: Location) => {
    setSelected(loc)
    try {
      const weather = await fetchWeather(loc.latitude, loc.longitude)
      console.log('Weather data:', weather)
    } catch (err) {
      console.error('Failed to fetch weather:', err)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Weather Map
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search for a city to see it on the map.
          </Typography>
        </Box>

        <SearchBar value={term} onChange={setTerm} onSearch={handleSearch} loading={status === 'loading'} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { md: 'minmax(280px, 360px) 1fr' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Paper variant="outlined" sx={{ height: '70vh', overflow: 'auto' }}>
            {status === 'loading' && (
              <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress />
              </Stack>
            )}
            {status === 'idle' && (
              <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
                <Typography color="text.secondary" align="center">
                  Search for a city to see matching locations.
                </Typography>
              </Stack>
            )}
            {status === 'empty' && (
              <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
                <Alert severity="info" variant="outlined">
                  {`No matches found for "${term}".`}
                </Alert>
              </Stack>
            )}
            {status === 'error' && (
              <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
                <Alert severity="error" variant="outlined">
                  {error ?? 'Something went wrong.'}
                </Alert>
              </Stack>
            )}
            {status === 'success' && (
              <LocationResults
                locations={matches}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
              />
            )}
          </Paper>

          <Paper variant="outlined" sx={{ height: '70vh', overflow: 'hidden' }}>
            <MapView location={selected} />
          </Paper>
        </Box>
      </Stack>
    </Container>
  )
}

export default App
