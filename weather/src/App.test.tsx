import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ColorModeProvider } from './ColorModeContext'
import App from './App'
import { fetchWeather, fetchSameNameLocations } from './api'

// Mock child components to avoid map/API dependencies
vi.mock('./components/MapView', () => ({
  MapView: () => <div data-testid="map-view" />,
}))

vi.mock('./components/OverlaySearchBar', () => ({
  OverlaySearchBar: vi.fn(({ open, onClose, onSelect }) =>
    open ? (
      <div
        data-testid="search-overlay"
        onClick={() => {
          onSelect({ id: 1, name: 'London', latitude: 51.5, longitude: -0.13, country: 'United Kingdom' })
          onClose()
        }}
      >
        Search Overlay
      </div>
    ) : null,
  ),
}))

vi.mock('./components/WeatherCard', () => ({
  WeatherCard: () => <div data-testid="weather-card" />,
}))

vi.mock('./components/SameNameCityCards', () => ({
  SameNameCityCards: vi.fn(() => <div data-testid="same-name-cards" />),
}))

vi.mock('./api', () => ({
  fetchWeather: vi.fn(),
  fetchSameNameLocations: vi.fn(),
  fetchBatchWeather: vi.fn(),
}))

const mockFetchWeather = vi.mocked(fetchWeather)
const mockFetchSameNameLocations = vi.mocked(fetchSameNameLocations)

function renderWithProviders(ui: React.ReactElement) {
  return render(<ColorModeProvider>{ui}</ColorModeProvider>)
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the map', () => {
    renderWithProviders(<App />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('opens search overlay when a printable character is pressed', () => {
    renderWithProviders(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'L' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('opens search overlay when / is pressed', () => {
    renderWithProviders(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: '/' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('opens search overlay when Cmd+K is pressed', () => {
    renderWithProviders(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('opens search overlay when Ctrl+K is pressed', () => {
    renderWithProviders(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('does not open overlay when typing in an input', () => {
    renderWithProviders(<App />)
    const input = document.createElement('input')
    fireEvent.keyDown(input, { key: 'L' })
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })

  it('does not open overlay for modifier-only keys', () => {
    renderWithProviders(<App />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyDown(document, { key: 'Shift' })
    fireEvent.keyDown(document, { key: 'Control' })
    fireEvent.keyDown(document, { key: 'Meta' })
    fireEvent.keyDown(document, { key: 'Alt' })
    fireEvent.keyDown(document, { key: 'F5' })
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })

  it('renders the inline search bar with keyboard shortcut hint', () => {
    renderWithProviders(<App />)
    const searchInput = screen.getByPlaceholderText(/Search cities/)
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('readOnly')
  })

  it('opens search overlay when the search bar is focused', () => {
    renderWithProviders(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    const searchInput = screen.getByPlaceholderText(/Search cities/)
    fireEvent.focus(searchInput)
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('closes overlay when backdrop is clicked', async () => {
    renderWithProviders(<App />)
    fireEvent.keyDown(document, { key: 'L' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('search-overlay'))
    await waitFor(() => {
      expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    })
  })

  it('shows loading skeleton while weather is being fetched', async () => {
    mockFetchWeather.mockImplementationOnce(
      () => new Promise(() => {}), // never resolves — keep loading
    )

    renderWithProviders(<App />)
    fireEvent.keyDown(document, { key: 'L' })
    fireEvent.click(screen.getByTestId('search-overlay'))

    await waitFor(() => {
      // The skeleton card uses MUI Skeleton — we check for the card wrapper
      const skeletons = document.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBeGreaterThanOrEqual(4)
    })
  })

  it('replaces loading skeleton with weather card on success', async () => {
    const mockWeatherData = {
      latitude: 51.5,
      longitude: -0.13,
      timezone: 'Europe/London',
      elevation: 25,
      observedAt: '2026-07-20T12:00:00Z',
      temperature: 18.5,
      apparentTemperature: 16.2,
      humidity: 65,
      precipitation: 0,
      weatherCode: 2,
      cloudCover: 40,
      surfacePressure: 1015,
      windSpeed: 12.3,
      windDirection: 220,
      windGusts: 18.5,
      units: { temperature: '°C', windSpeed: 'km/h', precipitation: 'mm', humidity: '%', pressure: 'hPa' },
    }
    mockFetchWeather.mockResolvedValueOnce(mockWeatherData)
    mockFetchSameNameLocations.mockResolvedValueOnce([])

    renderWithProviders(<App />)
    fireEvent.keyDown(document, { key: 'L' })
    fireEvent.click(screen.getByTestId('search-overlay'))

    await waitFor(() => {
      expect(screen.getByTestId('weather-card')).toBeInTheDocument()
    })

    // Loading skeletons should be gone
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBe(0)
  })

  it('hides loading skeleton on weather fetch error', async () => {
    mockFetchWeather.mockRejectedValueOnce(new Error('Network error'))

    renderWithProviders(<App />)
    fireEvent.keyDown(document, { key: 'L' })
    fireEvent.click(screen.getByTestId('search-overlay'))

    await waitFor(() => {
      // Error Snackbar should appear
      expect(screen.getByText('Failed to load weather data.')).toBeInTheDocument()
    })

    // Loading skeletons should be gone
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBe(0)
  })

  it('triggers same-name lookup after weather loads successfully', async () => {
    const mockWeatherData = {
      latitude: 51.5,
      longitude: -0.13,
      timezone: 'Europe/London',
      elevation: 25,
      observedAt: '2026-07-20T12:00:00Z',
      temperature: 18.5,
      apparentTemperature: 16.2,
      humidity: 65,
      precipitation: 0,
      weatherCode: 2,
      cloudCover: 40,
      surfacePressure: 1015,
      windSpeed: 12.3,
      windDirection: 220,
      windGusts: 18.5,
      units: { temperature: '°C', windSpeed: 'km/h', precipitation: 'mm', humidity: '%', pressure: 'hPa' },
    }
    mockFetchWeather.mockResolvedValueOnce(mockWeatherData)
    mockFetchSameNameLocations.mockResolvedValueOnce([])

    renderWithProviders(<App />)
    fireEvent.keyDown(document, { key: 'L' })
    fireEvent.click(screen.getByTestId('search-overlay'))

    await waitFor(() => {
      expect(mockFetchSameNameLocations).toHaveBeenCalledWith('London', 1)
    })
  })
})
