export interface Location {
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

export type RequestStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface GeocodingResponse {
  results?: Location[]
  generationtime_ms?: number
}
