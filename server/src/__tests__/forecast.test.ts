import { getCurrentWeather } from '../services/forecast'
import { config } from '../config'

const mockFetch = jest.fn()

beforeAll(() => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)
})

afterEach(() => {
  mockFetch.mockReset()
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockForecastResponse = {
  latitude: 39.8,
  longitude: -89.65,
  timezone: 'America/Chicago',
  elevation: 182,
  current_units: {
    time: 'iso8601',
    interval: 'seconds',
    temperature_2m: '°F',
    relative_humidity_2m: '%',
    apparent_temperature: '°F',
    precipitation: 'inch',
    weather_code: 'wmo code',
    cloud_cover: '%',
    surface_pressure: 'hPa',
    wind_speed_10m: 'mp/h',
    wind_direction_10m: '°',
    wind_gusts_10m: 'mp/h',
  },
  current: {
    time: '2026-07-20T18:15',
    interval: 900,
    temperature_2m: 85.3,
    relative_humidity_2m: 63,
    apparent_temperature: 89.7,
    precipitation: 0.0,
    weather_code: 0,
    cloud_cover: 0,
    surface_pressure: 1013.2,
    wind_speed_10m: 10.0,
    wind_direction_10m: 192,
    wind_gusts_10m: 15.7,
  },
}

describe('getCurrentWeather', () => {
  it('returns projected CurrentWeather on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockForecastResponse,
    })

    const result = await getCurrentWeather({ lat: 39.8, lon: -89.65 })
    expect(result.latitude).toBe(39.8)
    expect(result.longitude).toBe(-89.65)
    expect(result.temperature).toBe(85.3)
    expect(result.humidity).toBe(63)
    expect(result.windSpeed).toBe(10.0)
    expect(result.windDirection).toBe(192)
    expect(result.units.temperature).toBe('°F')
    expect(result.units.windSpeed).toBe('mp/h')
  })

  it('accepts metric units via query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockForecastResponse,
        current_units: { ...mockForecastResponse.current_units, temperature_2m: '°C', wind_speed_10m: 'km/h', precipitation: 'mm' },
      }),
    })

    const result = await getCurrentWeather({ lat: 39.8, lon: -89.65, units: 'metric' })
    expect(result.units.temperature).toBe('°C')
    expect(result.units.windSpeed).toBe('km/h')
  })

  it('defaults to imperial units', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockForecastResponse,
    })

    const result = await getCurrentWeather({ lat: 39.8, lon: -89.65 })
    expect(result.units.temperature).toBe('°F')
  })

  it('throws ApiError(400) on invalid lat', async () => {
    await expect(getCurrentWeather({ lat: 100, lon: 0 })).rejects.toThrow('Invalid or missing latitude')
    await expect(getCurrentWeather({ lat: -91, lon: 0 })).rejects.toThrow('Invalid or missing latitude')
    await expect(getCurrentWeather({ lat: NaN, lon: 0 })).rejects.toThrow('Invalid or missing latitude')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws ApiError(400) on invalid lon', async () => {
    await expect(getCurrentWeather({ lat: 0, lon: 200 })).rejects.toThrow('Invalid or missing longitude')
    await expect(getCurrentWeather({ lat: 0, lon: -181 })).rejects.toThrow('Invalid or missing longitude')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws ApiError(400) on invalid units', async () => {
    await expect(getCurrentWeather({ lat: 0, lon: 0, units: 'kelvin' as any })).rejects.toThrow('Invalid units')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws ApiError(502) on upstream HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })

    await expect(getCurrentWeather({ lat: 0, lon: 0 })).rejects.toThrow('HTTP 503')
  })

  it('throws ApiError(502) on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ENOTFOUND'))

    await expect(getCurrentWeather({ lat: 0, lon: 0 })).rejects.toThrow('Network error')
  })

  it('builds the correct URL (imperial)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockForecastResponse,
    })

    await getCurrentWeather({ lat: 39.8, lon: -89.65 })
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('latitude=39.8')
    expect(calledUrl).toContain('longitude=-89.65')
    expect(calledUrl).toContain('temperature_unit=fahrenheit')
    expect(calledUrl).toContain('wind_speed_unit=mph')
    expect(calledUrl).toContain('precipitation_unit=inch')
  })
})
