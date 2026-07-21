import { z } from 'zod'
import type { CurrentWeather, Location, LocationWithWeather } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export class ApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Zod schemas for runtime validation ─────────────────────────────────────

const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  feature_code: z.string().optional(),
  country_code: z.string().optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
  timezone: z.string().optional(),
  population: z.number().optional(),
  country: z.string().optional(),
}) satisfies z.ZodType<Location>

const unitsSchema = z.object({
  temperature: z.string(),
  windSpeed: z.string(),
  precipitation: z.string(),
  humidity: z.string(),
  pressure: z.string(),
})

const currentWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  elevation: z.number(),
  observedAt: z.string(),
  temperature: z.number(),
  apparentTemperature: z.number(),
  humidity: z.number(),
  precipitation: z.number(),
  weatherCode: z.number(),
  cloudCover: z.number(),
  surfacePressure: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
  windGusts: z.number(),
  units: unitsSchema,
}) satisfies z.ZodType<CurrentWeather>

const locationsResponseSchema = z.object({
  locations: z.array(locationSchema),
})

// ── API functions ───────────────────────────────────────────────────────────

export async function searchLocations(
  term: string,
  signal?: AbortSignal,
): Promise<Location[]> {
  const trimmed = term.trim()
  if (!trimmed) return []

  const url = apiUrl(`/locations?q=${encodeURIComponent(trimmed)}`)

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    throw new ApiError('Network error while searching. Check your connection.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.error ?? `Search failed (HTTP ${response.status}).`, response.status)
  }

  const raw = await response.json()
  const parsed = locationsResponseSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ApiError('Received an invalid response from the server.')
  }

  return parsed.data.locations
}

export async function fetchSameNameLocations(
  name: string,
  excludeId: number,
  signal?: AbortSignal,
): Promise<Location[]> {
  const results = await searchLocations(name, signal)
  return results.filter((loc) => loc.id !== excludeId)
}

export async function fetchBatchWeather(
  locations: Location[],
): Promise<LocationWithWeather[]> {
  const maxResults = 6
  const settled = await Promise.allSettled(
    locations.slice(0, maxResults).map(async (loc) => {
      const weather = await fetchWeather(loc.latitude, loc.longitude)
      return { location: loc, weather }
    }),
  )
  return settled
    .filter(
      (r): r is PromiseFulfilledResult<LocationWithWeather> =>
        r.status === 'fulfilled',
    )
    .map((r) => r.value)
}

export async function fetchWeather(
  lat: number,
  lon: number,
  units?: 'imperial' | 'metric',
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  })
  if (units) {
    params.set('units', units)
  }

  const url = apiUrl(`/weather?${params.toString()}`)

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new ApiError('Network error while fetching weather. Check your connection.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.error ?? `Weather fetch failed (HTTP ${response.status}).`, response.status)
  }

  const raw = await response.json()
  const parsed = currentWeatherSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ApiError('Received an invalid response from the weather service.')
  }

  return parsed.data
}
