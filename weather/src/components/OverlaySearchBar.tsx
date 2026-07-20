import { useEffect, useRef, useState, useCallback } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import { searchLocations, ApiError } from '../api'
import type { Location, RequestStatus } from '../types'

interface OverlaySearchBarProps {
  open: boolean
  initialQuery?: string
  onClose: () => void
  onSelect: (location: Location) => void
}

function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const cc = countryCode.toUpperCase()
  const A = 0x1f1e6
  return (
    String.fromCodePoint(A + cc.charCodeAt(0) - 65) +
    String.fromCodePoint(A + cc.charCodeAt(1) - 65)
  )
}

function buildSecondary(loc: Location): string {
  const region = [loc.admin1, loc.country].filter(Boolean).join(', ')
  return region
}

export function OverlaySearchBar({ open, initialQuery = '', onClose, onSelect }: OverlaySearchBarProps) {
  const [term, setTerm] = useState('')
  const [matches, setMatches] = useState<Location[]>([])
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleSearch = useCallback(async (value: string) => {
    setError(null)
    const trimmed = value.trim()
    if (!trimmed) {
      setMatches([])
      setStatus('idle')
      return
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    try {
      const results = await searchLocations(trimmed)
      if (!controller.signal.aborted) {
        setMatches(results)
        setStatus(results.length > 0 ? 'success' : 'empty')
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setMatches([])
        setStatus('error')
        setError(
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
        )
      }
    }
  }, [])

  // Debounce search when term changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(term)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [term, handleSearch])

  // Focus input when overlay opens, and seed with initialQuery
  useEffect(() => {
    if (!open) return

    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }

    if (initialQuery) {
      setTerm(initialQuery)
      handleSearch(initialQuery)
    } else {
      setTerm('')
      setMatches([])
      setStatus('idle')
      setError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle keyboard: Escape to close
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleInputChange = (value: string) => {
    setTerm(value)
  }

  const handleSelect = (loc: Location) => {
    onSelect(loc)
    onClose()
  }

  if (!open) return null

  const showDropdown = status === 'loading' || status === 'success' || status === 'empty' || status === 'error'

  return (
    <>
      {/* Backdrop */}
      <Box
        data-testid="search-backdrop"
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(4px)',
          zIndex: 1200,
        }}
        onClick={onClose}
      />

      {/* Search panel */}
      <Box
        sx={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 540,
          maxWidth: 'calc(100vw - 32px)',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            borderRadius: showDropdown && status === 'success' ? '12px 12px 0 0' : 2,
            overflow: 'hidden',
          }}
        >
          <TextField
            fullWidth
            inputRef={inputRef}
            value={term}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search for a city..."
            variant="outlined"
            autoComplete="off"
            slotProps={{
              input: {
                sx: { fontSize: '1.1rem', py: 0.5 },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Paper>

        {/* Dropdown results */}
        {showDropdown && (
          <Paper
            elevation={8}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderRadius: '0 0 12px 12px',
              maxHeight: 360,
              overflow: 'auto',
            }}
          >
            {status === 'loading' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            )}

            {status === 'empty' && (
              <Box sx={{ p: 2 }}>
                <Alert severity="info" variant="outlined" sx={{ m: 0 }}>
                  No matches found for "{term}".
                </Alert>
              </Box>
            )}

            {status === 'error' && (
              <Box sx={{ p: 2 }}>
                <Alert severity="error" variant="outlined" sx={{ m: 0 }}>
                  {error ?? 'Something went wrong.'}
                </Alert>
              </Box>
            )}

            {status === 'success' && (
              <List disablePadding>
                {matches.map((loc) => (
                  <ListItemButton
                    key={loc.id}
                    onClick={() => handleSelect(loc)}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" aria-hidden sx={{ fontSize: '1.1rem' }}>
                            {flagEmoji(loc.country_code)}
                          </Typography>
                          <Typography component="span" sx={{ fontWeight: 600 }}>
                            {loc.name}
                          </Typography>
                        </Box>
                      }
                      secondary={buildSecondary(loc)}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Box>
    </>
  )
}
