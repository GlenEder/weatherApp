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

export async function searchLocations(term: string): Promise<Location[]> {
  const trimmed = term.trim()
  if (!trimmed) return []

  const url = apiUrl(`/locations?q=${encodeURIComponent(trimmed)}`)

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new ApiError('Network error while searching. Check your connection.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.error ?? `Search failed (HTTP ${response.status}).`, response.status)
  }

  let data: { locations: Location[] }
  try {
    data = (await response.json()) as { locations: Location[] }
  } catch {
    throw new ApiError('Received an invalid response from the server.')
  }

  return data.locations
}

export async function fetchSameNameLocations(
  name: string,
  excludeId: number,
): Promise<Location[]> {
  const results = await searchLocations(name)
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

  let data: CurrentWeather
  try {
    data = (await response.json()) as CurrentWeather
  } catch {
    throw new ApiError('Received an invalid response from the weather service.')
  }

  return data
}
