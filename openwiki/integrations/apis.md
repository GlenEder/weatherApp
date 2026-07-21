# Integrations (APIs)

The app integrates with the free [Open-Meteo](https://open-meteo.com/) weather API. No API key is required, and rate limits are generous. The Express server acts as a proxy layer — the frontend never calls Open-Meteo directly.

---

## Architecture

```
Client (React)    Server (Express)    Open-Meteo
     │                  │                  │
     │── GET /locations ──►  GET Geocoding API ──►
     │◄── JSON response ◄──  JSON response ◄─────
     │                  │                  │
     │── GET /weather ────►  GET Forecast API ───►
     │◄── JSON response ◄──  JSON response ◄─────
```

The proxy layer provides:
- **Server-side validation** with Zod before any upstream call
- **Unit conversion** — Open-Meteo units specified per query (temperature, wind, precipitation)
- **Error translation** — upstream errors → standardized `ApiError(502, ...)` responses
- **Field projection** — Open-Meteo's snake_case fields → server's camelCase TypeScript types
- **Timeout handling** — configurable `AbortController` timeout (default 5s)

---

## Open-Meteo Geocoding API

### Endpoint
```
GET {GEOCODING_BASE_URL}/search?name={term}&count=10&language=en&format=json
```

Base URL default: `https://geocoding-api.open-meteo.com/v1`

### Parameters

| Parameter | Value | Notes |
|---|---|---|
| `name` | URL-encoded search term | Required, 1-200 characters |
| `count` | `10` | Max results |
| `language` | `en` | English results |
| `format` | `json` | JSON response format |

### Response Projection

The raw Open-Meteo response (`OpenMeteoGeocodingResult`) is mapped to the internal `Location` type:

| Open-Meteo (snake_case) | Server Type (camelCase) |
|---|---|
| `id` | `id` |
| `name` | `name` |
| `latitude` | `latitude` |
| `longitude` | `longitude` |
| `elevation` | `elevation` |
| `feature_code` | `feature_code` |
| `country_code` | `country_code` |
| `admin1` | `admin1` |
| `admin2` | `admin2` |
| `timezone` | `timezone` |
| `population` | `population` |
| `country` | `country` |

### Error Mapping

| Scenario | HTTP Status | Message |
|---|---|---|
| Empty/whitespace-only query | 400 | `"Missing or empty search term (q)"` |
| Query > 200 chars | 400 | `"Search term too long (max 200 characters)"` |
| Upstream timeout | 502 | `"Upstream geocoding service timed out"` |
| Network error | 502 | `"Network error while contacting geocoding service"` |
| Upstream HTTP error | 502 | `"Geocoding service returned HTTP {status}"` |
| Invalid JSON | 502 | `"Invalid JSON from geocoding service"` |

---

## Open-Meteo Forecast API

### Endpoint
```
GET {FORECAST_BASE_URL}/forecast?latitude={}&longitude={}&current={params}&temperature_unit={}&wind_speed_unit={}&precipitation_unit={}&timezone=auto
```

Base URL default: `https://api.open-meteo.com/v1`

### Current Parameters

10 weather variables are requested in the `current` parameter:

```
temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,
weather_code,cloud_cover,surface_pressure,wind_speed_10m,
wind_direction_10m,wind_gusts_10m
```

### Unit Modes

| System | `temperature_unit` | `wind_speed_unit` | `precipitation_unit` |
|---|---|---|---|
| `imperial` (default) | `fahrenheit` | `mph` | `inch` |
| `metric` | `celsius` | `kmh` | `mm` |

The `timezone=auto` parameter lets Open-Meteo detect the timezone from coordinates.

### Response Projection

The raw Open-Meteo response maps to two internal types:

**`CurrentWeather`** (top-level fields):

| Open-Meteo | Server |
|---|---|
| `current.time` | `observedAt` |
| `current.temperature_2m` | `temperature` |
| `current.apparent_temperature` | `apparentTemperature` |
| `current.relative_humidity_2m` | `humidity` |
| `current.precipitation` | `precipitation` |
| `current.weather_code` | `weatherCode` |
| `current.cloud_cover` | `cloudCover` |
| `current.surface_pressure` | `surfacePressure` |
| `current.wind_speed_10m` | `windSpeed` |
| `current.wind_direction_10m` | `windDirection` |
| `current.wind_gusts_10m` | `windGusts` |

**`Units`** (from `current_units`):

| Open-Meteo | Server |
|---|---|
| `temperature_2m` | `temperature` |
| `relative_humidity_2m` | `humidity` |
| `precipitation` | `precipitation` |
| `surface_pressure` | `pressure` |
| `wind_speed_10m` | `windSpeed` |

### WMO Weather Code Mapping

Weather codes follow the [WMO standard](https://open-meteo.com/en/docs#weathervariables). The frontend `WeatherCard` maps codes to human-readable descriptions:

| Code(s) | Description |
|---|---|
| 0 | Clear sky |
| 1-3 | Mainly clear, partly cloudy, overcast |
| 45-48 | Foggy, depositing rime fog |
| 51-57 | Drizzle (light to dense, freezing) |
| 61-67 | Rain (slight to heavy, freezing) |
| 71-77 | Snow (slight to heavy, snow grains) |
| 80-86 | Showers (rain or snow) |
| 95-99 | Thunderstorm (with/without hail) |

### Error Mapping

| Scenario | HTTP Status | Message |
|---|---|---|
| Invalid lat (non-number, NaN, out of range) | 400 | `"Invalid or missing latitude..."` |
| Invalid lon (non-number, NaN, out of range) | 400 | `"Invalid or missing longitude..."` |
| Invalid units | 400 | `"Invalid units (must be imperial or metric)"` |
| Upstream timeout | 502 | `"Upstream forecast service timed out"` |
| Network error | 502 | `"Network error while contacting forecast service"` |
| Upstream HTTP error | 502 | `"Forecast service returned HTTP {status}"` |
| Invalid JSON | 502 | `"Invalid JSON from forecast service"` |

---

## Key Integration Details

### No Caching
Neither the server nor the client caches API responses. Every search and weather fetch triggers a new upstream request. This is acceptable because:
- Open-Meteo has generous rate limits for non-commercial use
- The app is designed for infrequent human use, not automated polling

### No CORS Headers
The server does not include CORS headers because:
- **Development**: Vite dev server proxies API requests (same origin from `localhost:5173`)
- **Production**: Express serves the frontend static files (same origin)

### No API Key
Open-Meteo is a free, open-data API that requires no authentication key. This is a deliberate architectural choice that eliminates the need for secret management.

### Timeout Handling
Both services use `AbortController` with a configurable timeout (default 5 seconds via `REQUEST_TIMEOUT_MS`). Timeouts produce HTTP 502 responses distinguishable from other network errors.
