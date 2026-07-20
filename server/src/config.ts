export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  geocodingBaseUrl: process.env.GEOCODING_BASE_URL ?? 'https://geocoding-api.open-meteo.com/v1',
  forecastBaseUrl: process.env.FORECAST_BASE_URL ?? 'https://api.open-meteo.com/v1',
  defaultUnits: process.env.DEFAULT_UNITS ?? 'imperial',
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS ?? '5000', 10),
} as const
