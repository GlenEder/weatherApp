import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeatherCard } from '../components/WeatherCard'
import type { Location, CurrentWeather } from '../types'

const mockLocation: Location = {
  id: 1,
  name: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  country_code: 'GB',
  country: 'United Kingdom',
  admin1: 'England',
}

const mockWeather: CurrentWeather = {
  latitude: 51.5074,
  longitude: -0.1278,
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
  units: {
    temperature: '°C',
    windSpeed: 'km/h',
    precipitation: 'mm',
    humidity: '%',
    pressure: 'hPa',
  },
}

describe('WeatherCard', () => {
  it('renders location name and admin1', () => {
    render(<WeatherCard location={mockLocation} weather={mockWeather} onClose={vi.fn()} />)
    expect(screen.getByText('London, England')).toBeInTheDocument()
  })

  it('renders temperature', () => {
    render(<WeatherCard location={mockLocation} weather={mockWeather} onClose={vi.fn()} />)
    expect(screen.getByText('19°C')).toBeInTheDocument()
  })

  it('renders weather condition description', () => {
    render(<WeatherCard location={mockLocation} weather={mockWeather} onClose={vi.fn()} />)
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument()
  })

  it('renders feels like temperature', () => {
    render(<WeatherCard location={mockLocation} weather={mockWeather} onClose={vi.fn()} />)
    expect(screen.getByText(/Feels like 16°C/)).toBeInTheDocument()
  })

  it('renders weather details', () => {
    render(<WeatherCard location={mockLocation} weather={mockWeather} onClose={vi.fn()} />)
    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText('12 km/h')).toBeInTheDocument()
    expect(screen.getByText('0mm')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<WeatherCard location={mockLocation} weather={mockWeather} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
