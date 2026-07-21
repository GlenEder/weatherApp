import { config } from '../config'
import { ApiError } from '../errors'
import type { CurrentWeather, Units, UnitsMode, WeatherQuery } from '../types'

interface OpenMeteoCurrentUnits {
  time: string
  interval: string
  temperature_2m: string
  relative_humidity_2m: string
  apparent_temperature: string
  precipitation: string
  weather_code: string
  cloud_cover: string
  surface_pressure: string
  wind_speed_10m: string
  wind_direction_10m: string
  wind_gusts_10m: string
}

interface OpenMeteoCurrentData {
  time: string
  interval: number
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  cloud_cover: number
  surface_pressure: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
}

interface OpenMeteoForecastResponse {
  latitude: number
  longitude: number
  timezone: string
  elevation: number
  current_units: OpenMeteoCurrentUnits
  current: OpenMeteoCurrentData
}

const CURRENT_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
].join(',')

const UNITS_MAP: Record<UnitsMode, { temperature: string; wind: string; precipitation: string }> = {
  imperial: { temperature: 'fahrenheit', wind: 'mph', precipitation: 'inch' },
  metric: { temperature: 'celsius', wind: 'kmh', precipitation: 'mm' },
}

function validateQuery(query: WeatherQuery): { lat: number; lon: number; units: UnitsMode } {
  const lat = query.lat
  const lon = query.lon
  const units = query.units ?? 'imperial'

  if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
    throw new ApiError(400, 'Invalid or missing latitude (must be a number between -90 and 90)')
  }
  if (typeof lon !== 'number' || isNaN(lon) || lon < -180 || lon > 180) {
    throw new ApiError(400, 'Invalid or missing longitude (must be a number between -180 and 180)')
  }
  if (units !== 'imperial' && units !== 'metric') {
    throw new ApiError(400, 'Invalid units (must be "imperial" or "metric")')
  }

  return { lat, lon, units }
}

function projectUnits(raw: OpenMeteoCurrentUnits): Units {
  return {
    temperature: raw.temperature_2m,
    windSpeed: raw.wind_speed_10m,
    precipitation: raw.precipitation,
    humidity: raw.relative_humidity_2m,
    pressure: raw.surface_pressure,
  }
}

function projectWeather(raw: OpenMeteoForecastResponse): CurrentWeather {
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
    elevation: raw.elevation,
    observedAt: raw.current.time,
    temperature: raw.current.temperature_2m,
    apparentTemperature: raw.current.apparent_temperature,
    humidity: raw.current.relative_humidity_2m,
    precipitation: raw.current.precipitation,
    weatherCode: raw.current.weather_code,
    cloudCover: raw.current.cloud_cover,
    surfacePressure: raw.current.surface_pressure,
    windSpeed: raw.current.wind_speed_10m,
    windDirection: raw.current.wind_direction_10m,
    windGusts: raw.current.wind_gusts_10m,
    units: projectUnits(raw.current_units),
  }
}

export async function getCurrentWeather(query: WeatherQuery): Promise<CurrentWeather> {
  const { lat, lon, units } = validateQuery(query)

  const unitCfg = UNITS_MAP[units]
  const url = `${config.forecastBaseUrl}/forecast?latitude=${lat}&longitude=${lon}&current=${CURRENT_PARAMS}&temperature_unit=${unitCfg.temperature}&wind_speed_unit=${unitCfg.wind}&precipitation_unit=${unitCfg.precipitation}&timezone=auto`

  let response: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)
    response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(502, 'Upstream forecast service timed out')
    }
    throw new ApiError(502, 'Network error while contacting forecast service')
  }

  if (!response.ok) {
    throw new ApiError(502, `Forecast service returned HTTP ${response.status}`)
  }

  let data: OpenMeteoForecastResponse
  try {
    data = (await response.json()) as OpenMeteoForecastResponse
  } catch {
    throw new ApiError(502, 'Invalid JSON from forecast service')
  }

  return projectWeather(data)
}
