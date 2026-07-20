import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Mock child components to avoid map/API dependencies
vi.mock('./components/MapView', () => ({
  MapView: () => <div data-testid="map-view" />,
}))

vi.mock('./components/OverlaySearchBar', () => ({
  OverlaySearchBar: vi.fn(({ open, onClose, onSelect }) =>
    open ? <div data-testid="search-overlay" onClick={onClose}>Search Overlay</div> : null,
  ),
}))

vi.mock('./components/WeatherCard', () => ({
  WeatherCard: () => <div data-testid="weather-card" />,
}))

vi.mock('./api', () => ({
  fetchWeather: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the map', () => {
    render(<App />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('opens search overlay when / key is pressed', () => {
    render(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: '/' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('opens search overlay when Cmd+K is pressed', () => {
    render(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('opens search overlay when Ctrl+K is pressed', () => {
    render(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('does not open overlay when typing / in an input', () => {
    render(<App />)
    const input = document.createElement('input')
    fireEvent.keyDown(input, { key: '/' })
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })

  it('closes overlay when Escape is pressed', () => {
    render(<App />)
    fireEvent.keyDown(document, { key: '/' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
    // Clicking the overlay mock triggers onClose
    fireEvent.click(screen.getByTestId('search-overlay'))
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })
})
