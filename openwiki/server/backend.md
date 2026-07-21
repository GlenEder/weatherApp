# Server (Backend)

The backend is a minimal **Express + TypeScript** server that acts as a proxy between the React frontend and the free [Open-Meteo API](https://open-meteo.com/). It has only 2 production dependencies (`express`, `zod`) and uses Node's native `fetch`.

---

## App Setup (`/server/src/index.ts`)

The Express app is configured with:

- **`app.disable('x-powered-by')`** — removes the `X-Powered-By` header
- **No body parsers** — all routes are GET with query parameters
- **No CORS middleware** — designed for same-origin or proxy deployment
- **`GET /health`** — returns `{ status: "ok" }`

**Production mode** (`NODE_ENV === 'production'`):
- Serves static files from `../weather/dist` (sibling frontend build output)
- Catch-all `GET *` returns `index.html` for SPA client-side routing

**Error handling** (last middleware):
- `notFound` — unmatched routes → 404 `{ error: "Not found" }`
- `errorHandler` — `ApiError` → HTTP status + JSON body; other errors → 500 + console.error

The app only calls `app.listen()` when **not** in a test environment (`NODE_ENV !== 'test'` and no `JEST_WORKER_ID`), enabling supertest to bind ephemeral ports. The `app` instance is exported as default for test imports.

---

## Routes

Both routes follow the same pattern: Zod schema → service call → error passthrough.

### `GET /locations?q=<term>`

- **Zod validation**: `q` must be a string, min 1 char, max 200 chars
- **Failure**: 400 with the first Zod error message
- **Success**: calls `searchLocations({ q })` → 200 with `{ locations: Location[] }`
- **Error passthrough**: service errors (always `ApiError`) propagate via `next(err)` to global handler

### `GET /weather?lat=<>&lon=<>&units=imperial`

- **Zod validation**: `lat` (string → parseFloat, -90 to 90), `lon` (string → parseFloat, -180 to 180), `units` (optional enum, defaults to `'imperial'`)
- **Failure**: 400 with the first Zod error message
- **Success**: calls `getCurrentWeather({ lat, lon, units })` → 200 with `CurrentWeather` object
- **Error passthrough**: same pattern as above

---

## Services

Each service wraps one external Open-Meteo API. Both use the same internal patterns:

- **Input validation** (defensive — duplicates route-level Zod checks)
- **HTTP request** via native `fetch` with `AbortController` timeout
- **Error translation** — all upstream errors become `ApiError(502, ...)` with descriptive messages
- **Data projection** — snake_case Open-Meteo response fields are mapped to camelCase TypeScript interfaces

### `services/geocoding.ts`

| Aspect | Detail |
|---|---|
| Function | `searchLocations(query: LocationsQuery): Promise<{ locations: Location[] }>` |
| URL | `{base}/search?name={term}&count=10&language=en&format=json` |
| Validation | Non-empty term, max 200 chars |
| Error types | `502` on timeout, network failure, non-2xx response, invalid JSON |
| Projection | `projectLocation()` maps raw `OpenMeteoGeocodingResult` → `Location` |

### `services/forecast.ts`

| Aspect | Detail |
|---|---|
| Function | `getCurrentWeather(query: WeatherQuery): Promise<CurrentWeather>` |
| URL | `{base}/forecast?latitude={}&longitude={}&current={params}&temperature_unit={}&wind_speed_unit={}&precipitation_unit={}&timezone=auto` |
| Current params | 10 comma-separated weather variables (temperature_2m, humidity, wind, etc.) |
| Validation | lat [-90, 90], lon [-180, 180], units must be imperial/metric |
| Error types | `502` on timeout, network failure, non-2xx response, invalid JSON |
| Projection | `projectWeather()` + `projectUnits()` map raw response → `CurrentWeather` + `Units` |

### Units Mapping

| System | temperature | wind | precipitation |
|---|---|---|---|
| `imperial` | fahrenheit | mph | inch |
| `metric` | celsius | kmh | mm |

---

## Configuration (`/server/src/config.ts`)

A single `config` object reads environment variables with sensible defaults:

```
port:                PORT               → 3001
geocodingBaseUrl:    GEOCODING_BASE_URL → https://geocoding-api.open-meteo.com/v1
forecastBaseUrl:     FORECAST_BASE_URL  → https://api.open-meteo.com/v1
defaultUnits:        DEFAULT_UNITS      → "imperial"
requestTimeoutMs:    REQUEST_TIMEOUT_MS → 5000
```

The `as const` assertion at the end provides literal types. No `dotenv` dependency is needed — environment variables are read inline.

---

## Error Handling (`/server/src/errors.ts`)

```typescript
class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) { ... }
}
```

- `ApiError` is the only error type thrown by services and caught by the error handler
- The `errorHandler` middleware checks `instanceof ApiError` — if so, responds with the error's status and message; otherwise logs to console and returns 500
- The `notFound` middleware catches any unmatched route

---

## Testing

**Configuration** (`/server/jest.config.js`):
- Preset: `ts-jest`
- Environment: `node`
- Test file pattern: `**/__tests__/**/*.test.ts`
- `clearMocks: true`

**Test files** (4 files, ~30 tests):

| File | Type | What's Mocked | Coverage |
|---|---|---|---|
| `geocoding.test.ts` | Unit (service) | `globalThis.fetch` | Validation (empty, too long), HTTP errors, JSON errors, URL building, projection |
| `forecast.test.ts` | Unit (service) | `globalThis.fetch` | Validation (lat, lon, NaN, units), HTTP errors, URL building, unit defaults |
| `locations.test.ts` | Integration (route) | `searchLocations` via `jest.mock` | 200, 200 empty, 400 (missing/empty q), 502 upstream error |
| `weather.test.ts` | Integration (route) | `getCurrentWeather` via `jest.mock` | 200, 200 metric, 400 (missing/invalid/out-of-range params), 502 upstream error |

**Pattern**: Service tests spy on `globalThis.fetch` for full isolation. Route tests mock the service module and use supertest to validate HTTP status + response body.

---

## Architecture Diagram

```
Express App (index.ts)
├── GET /health → inline handler
├── GET /locations → locationsRouter (zod)
│   └── searchLocations() → Open-Meteo Geocoding
├── GET /weather → weatherRouter (zod)
│   └── getCurrentWeather() → Open-Meteo Forecast
├── Static files (production) / SPA fallback
├── notFound → 404
└── errorHandler → ApiError → JSON | 500
```

---

## Dependencies

**Production**: `express` (^4.21.0), `zod` (^3.24.0)

**Dev**: `typescript` (~5.7.0), `tsx` (^4.19.0), `jest` (^29.7.0), `ts-jest` (^29.2.0), `supertest` (^7.0.0), `@types/*` (express, jest, node, supertest)
