import { config } from '../config'
import { ApiError } from '../errors'
import type { Location, LocationsQuery } from '../types'

interface OpenMeteoGeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation?: number
  feature_code?: string
  country_code?: string
  admin1?: string
  admin2?: string
  timezone?: string
  population?: number
  country?: string
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[]
  generationtime_ms?: number
}

function validateQuery(query: LocationsQuery): string {
  const trimmed = query.q?.trim()
  if (!trimmed) {
    throw new ApiError(400, 'Missing or empty search term (q)')
  }
  if (trimmed.length > 200) {
    throw new ApiError(400, 'Search term too long (max 200 characters)')
  }
  return trimmed
}

function projectLocation(raw: OpenMeteoGeocodingResult): Location {
  return {
    id: raw.id,
    name: raw.name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    feature_code: raw.feature_code,
    country_code: raw.country_code,
    admin1: raw.admin1,
    admin2: raw.admin2,
    timezone: raw.timezone,
    population: raw.population,
    country: raw.country,
  }
}

export async function searchLocations(query: LocationsQuery): Promise<{ locations: Location[] }> {
  const term = validateQuery(query)

  const url = `${config.geocodingBaseUrl}/search?name=${encodeURIComponent(term)}&count=10&language=en&format=json`

  let response: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)
    response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(502, 'Upstream geocoding service timed out')
    }
    throw new ApiError(502, 'Network error while contacting geocoding service')
  }

  if (!response.ok) {
    throw new ApiError(502, `Geocoding service returned HTTP ${response.status}`)
  }

  let data: OpenMeteoGeocodingResponse
  try {
    data = (await response.json()) as OpenMeteoGeocodingResponse
  } catch {
    throw new ApiError(502, 'Invalid JSON from geocoding service')
  }

  const locations = (data.results ?? []).map(projectLocation)
  return { locations }
}
