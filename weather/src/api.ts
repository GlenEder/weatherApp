import type { GeocodingResponse, Location } from './types'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

export class GeocodingError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GeocodingError'
    this.status = status
  }
}

export async function searchLocations(term: string): Promise<Location[]> {
  const trimmed = term.trim()
  if (!trimmed) return []

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmed)}&count=10&language=en&format=json`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new GeocodingError('Network error while searching. Check your connection.')
  }

  if (!response.ok) {
    throw new GeocodingError(`Search failed (HTTP ${response.status}).`, response.status)
  }

  let data: GeocodingResponse
  try {
    data = (await response.json()) as GeocodingResponse
  } catch {
    throw new GeocodingError('Received an invalid response from the geocoding service.')
  }

  return data.results ?? []
}
