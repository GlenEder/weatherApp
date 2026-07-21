import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SameNameCityCards } from './SameNameCityCards'
import type { Location, CurrentWeather } from '../types'

const parisFrance: Location = {
  id: 1,
  name: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  country: 'France',
  admin1: 'Île-de-France',
}

const parisTexas: Location = {
  id: 2,
  name: 'Paris',
  latitude: 33.6609,
  longitude: -95.5555,
  country: 'United States',
  admin1: 'Texas',
}

const mockWeather: CurrentWeather = {
  latitude: 48.8566,
  longitude: 2.3522,
  timezone: 'Europe/Paris',
  elevation: 35,
  observedAt: '2026-07-20T12:00:00Z',
  temperature: 22,
  apparentTemperature: 20,
  humidity: 55,
  precipitation: 0,
  weatherCode: 0,
  cloudCover: 10,
  surfacePressure: 1015,
  windSpeed: 10,
  windDirection: 180,
  windGusts: 15,
  units: {
    temperature: '°C',
    windSpeed: 'km/h',
    precipitation: 'mm',
    humidity: '%',
    pressure: 'hPa',
  },
}

describe('SameNameCityCards', () => {
  it('renders nothing when not loading and empty', () => {
    const { container } = render(
      <SameNameCityCards cities={[]} loading={false} onSelect={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders skeleton cards while loading', () => {
    const { container } = render(
      <SameNameCityCards cities={[]} loading={true} onSelect={vi.fn()} />,
    )
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders city cards with weather data', () => {
    render(
      <SameNameCityCards
        cities={[
          { location: parisFrance, weather: mockWeather },
          { location: parisTexas, weather: mockWeather },
        ]}
        loading={false}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getAllByText(/Paris/)).toHaveLength(2)
    expect(screen.getByText(/Île-de-France/)).toBeInTheDocument()
    expect(screen.getByText(/Texas/)).toBeInTheDocument()
    expect(screen.getAllByText(/22°C/)).toHaveLength(2)
    expect(screen.getAllByText(/Clear sky/)).toHaveLength(2)
  })

  it('calls onSelect when a card is clicked', () => {
    const onSelect = vi.fn()
    render(
      <SameNameCityCards
        cities={[{ location: parisTexas, weather: mockWeather }]}
        loading={false}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(parisTexas)
  })

  it('renders banner with city name', () => {
    render(
      <SameNameCityCards
        cityName="Springfield"
        cities={[{ location: parisTexas, weather: mockWeather }]}
        loading={false}
        onSelect={vi.fn()}
      />,
    )
    expect(
      screen.getByText('Other Springfields from around the world…'),
    ).toBeInTheDocument()
  })
})
