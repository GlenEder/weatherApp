import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Mock child components to avoid map/API dependencies
vi.mock('./components/MapView', () => ({
  MapView: () => <div data-testid="map-view" />,
}))

vi.mock('./components/OverlaySearchBar', () => ({
  OverlaySearchBar: vi.fn(({ open, onClose }) =>
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

  it('opens search overlay when a printable character is pressed', () => {
    render(<App />)
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'L' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
  })

  it('opens search overlay when / is pressed', () => {
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

  it('does not open overlay when typing in an input', () => {
    render(<App />)
    const input = document.createElement('input')
    fireEvent.keyDown(input, { key: 'L' })
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })

  it('does not open overlay for modifier-only keys', () => {
    render(<App />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyDown(document, { key: 'Shift' })
    fireEvent.keyDown(document, { key: 'Control' })
    fireEvent.keyDown(document, { key: 'Meta' })
    fireEvent.keyDown(document, { key: 'Alt' })
    fireEvent.keyDown(document, { key: 'F5' })
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })

  it('closes overlay when backdrop is clicked', () => {
    render(<App />)
    fireEvent.keyDown(document, { key: 'L' })
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('search-overlay'))
    expect(screen.queryByTestId('search-overlay')).not.toBeInTheDocument()
  })
})
