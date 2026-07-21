# Weather App

Full-stack weather app: search any city, pick the right match from a
disambiguated list, view it on a map, and fetch current weather conditions.

Built as described in [`docs/user_story.md`](docs/user_story.md).

## Structure

| Directory | Purpose |
|---|---|
| [`weather/`](weather/) | React + Vite + TypeScript frontend (MUI 6, Leaflet) |
| [`server/`](server/) | Node + Express + TypeScript backend (Open-Meteo proxy) |

## Quick start

### Prerequisites

- Node >= 20
- npm

### 1. Start the server

```bash
cd server
npm install
npm run dev
```

The server starts on `http://localhost:3001`.

| Script | Description |
|---|---|
| `npm run dev` | Start with `tsx watch` (auto-restart on changes) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JS (`node dist/index.js`) |
| `npm test` | Run Jest test suite |

### 2. Start the client

```bash
cd weather
npm install
npm run dev
```

The client starts on `http://localhost:5173`.

Open the URL in your browser. The Vite dev server proxies `/locations` and
`/weather` requests to the backend, so everything works from one origin.

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |

## How it works

1. Type a city name in the search bar and submit.
2. The client sends the term to the local server's `GET /locations?q=<term>`.
3. The server proxies to the Open-Meteo Geocoding API and returns up to 10
   matching cities with enough detail (country, state, population) to
   disambiguate.
4. Results are shown in a scrollable list. Pick the correct city.
5. A marker drops on the Leaflet map at that city's coordinates.
6. A weather card appears in the bottom-left corner showing temperature, feels-like,
   condition, humidity, wind, and precipitation for the selected city.

## Server endpoints

### `GET /locations?q=<term>`

Proxies the Open-Meteo Geocoding API. Returns:

```json
{
  "locations": [
    {
      "id": 4250542,
      "name": "Springfield",
      "latitude": 39.8,
      "longitude": -89.65,
      "country": "United States",
      "admin1": "Illinois",
      "country_code": "US",
      "feature_code": "PPLA",
      "timezone": "America/Chicago",
      "population": 114394,
      "elevation": 182
    }
  ]
}
```

| Status | When |
|---|---|
| `200` | Success (empty array = no matches) |
| `400` | Missing or invalid `q` |
| `502` | Upstream Open-Meteo error |

### `GET /weather?lat=<lat>&lon=<lon>&units=imperial`

Proxies the Open-Meteo Forecast API. `units` is optional (defaults to imperial).

```json
{
  "latitude": 39.8,
  "longitude": -89.65,
  "timezone": "America/Chicago",
  "elevation": 182,
  "observedAt": "2026-07-20T18:15",
  "temperature": 85.3,
  "apparentTemperature": 89.7,
  "humidity": 63,
  "precipitation": 0.0,
  "weatherCode": 0,
  "cloudCover": 0,
  "surfacePressure": 1013.2,
  "windSpeed": 10.0,
  "windDirection": 192,
  "windGusts": 15.7,
  "units": {
    "temperature": "°F",
    "windSpeed": "mp/h",
    "precipitation": "inch",
    "humidity": "%",
    "pressure": "hPa"
  }
}
```

| Status | When |
|---|---|
| `200` | Success |
| `400` | Invalid or missing `lat`/`lon`, or bad units value |
| `502` | Upstream Open-Meteo error |

### `GET /health`

Returns `{ "status": "ok" }` — useful for dev sanity checks.

## Environment variables

### Server (`server/`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `GEOCODING_BASE_URL` | `https://geocoding-api.open-meteo.com/v1` | Upstream geocoding base |
| `FORECAST_BASE_URL` | `https://api.open-meteo.com/v1` | Upstream forecast base |
| `DEFAULT_UNITS` | `imperial` | `imperial` or `metric` |
| `REQUEST_TIMEOUT_MS` | `5000` | Upstream request timeout |

### Client (`weather/`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE` | `(empty)` | API base URL (set to `http://localhost:3001` to bypass Vite proxy) |

## Tests

```bash
cd server
npm test
```

30 unit and integration tests cover the geocoding and forecast services (mocked
fetch) and the route handlers (supertest with mocked services).
