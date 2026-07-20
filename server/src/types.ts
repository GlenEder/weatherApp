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

export interface Units {
  temperature: string
  windSpeed: string
  precipitation: string
  humidity: string
  pressure: string
}

export interface CurrentWeather {
  latitude: number
  longitude: number
  timezone: string
  elevation: number
  observedAt: string
  temperature: number
  apparentTemperature: number
  humidity: number
  precipitation: number
  weatherCode: number
  cloudCover: number
  surfacePressure: number
  windSpeed: number
  windDirection: number
  windGusts: number
  units: Units
}

export type UnitsMode = 'imperial' | 'metric'

export interface LocationsQuery {
  q: string
}

export interface WeatherQuery {
  lat: number
  lon: number
  units?: UnitsMode
}
