# Architecture Overview

## System Design

The weather app is a two-process monorepo: an **Express backend** proxies external weather APIs, and a **React frontend** renders the map + weather UI. There is no database — all data comes from Open-Meteo's free APIs on every request.

```
┌─────────────┐   HTTP /locations       ┌──────────────┐   HTTP      ┌──────────────────┐
│             │   HTTP /weather          │              │  proxied    │                  │
│  React App  │ ─────────────────────►   │  Express     │ ──────────► │  Open-Meteo API  │
│  (Vite +    │                          │  Server      │             │  (geocoding +    │
│   Leaflet)  │ ◄──────────────────────  │  (port 3001) │ ◄────────── │   forecast)      │
│             │       JSON responses     │              │  responses  │                  │
│ (port 5173  │                          └──────────────┘             └──────────────────┘
│  dev only)  │
└─────────────┘
       │
       │ Vite proxy (dev) or static serving (prod)
       └─── Same origin — no CORS needed
```

### Key Properties

- **No database** — all state is ephemeral (React component state + upstream API responses)
- **No authentication** — Open-Meteo requires no API key and has generous rate limits
- **No caching** — every request fetches fresh data from Open-Meteo
- **Same-origin architecture** — Vite dev server proxies API paths; production Express serves the built frontend static files
- **Custom error type** — `ApiError` (status + message) is the sole mechanism for HTTP error signaling from services through routes to the global error handler

---

## Data Flow (Request Lifecycle)

### 1. Location Search

```
User types "Paris"
  → OverlaySearchBar debounces input (300ms)
  → api.searchLocations("Paris")
  → GET /locations?q=Paris
  → zod validates q (string, 1-200 chars)
  → geocoding.searchLocations({ q: "Paris" })
  → fetch Open-Meteo Geocoding API
  → Projects snake_case → camelCase (projectLocation)
  → Returns { locations: Location[] }
  → Client renders List of results
  → User clicks "Paris, France"
```

### 2. Weather Fetch + Same-Name Discovery

```
User selects "Paris, France"
  → handleSelect()
  → fetchWeather(48.8566, 2.3522)
  → GET /weather?lat=48.8566&lon=2.3522
  → zod validates lat/lon (coerce string → number, range checks)
  → forecast.getCurrentWeather({ lat, lon, units: "imperial" })
  → fetch Open-Meteo Forecast API
  → Projects to CurrentWeather shape
  → WeatherCard renders at bottom-left
  → loadSameNameCities(location) fires in parallel:
      searchLocations("Paris") → filters out selected ID
      fetchBatchWeather(sameNameLocations) → up to 6 parallel requests (Promise.allSettled)
      SameNameCityCards renders horizontal scroll row
```

### 3. Same-Name Card Swap

```
User clicks "Paris, Texas" card
  → handleSameNameSelect swaps selected/weather in-memory
  → The previous "Paris, France" entry moves into the cards list
  → No API calls — pure state rotation
```

---

## Route Layer

The Express server registers three top-level paths:

| Path | Handler | Source |
|---|---|---|
| `GET /health` | Inline in `index.ts` | `/server/src/index.ts` |
| `/locations` | `locationsRouter` | `/server/src/routes/locations.ts` |
| `/weather` | `weatherRouter` | `/server/src/routes/weather.ts` |

Routes use **Zod** schemas for input validation and coerce string query params to typed values. Errors thrown by services propagate via `next(err)` to the global `errorHandler`, which maps `ApiError` instances to JSON error responses.

---

## Frontend State Architecture

All application state lives in `App.tsx` using `useState` hooks:

| State | Type | Description |
|---|---|---|
| `selected` | `Location \| null` | Currently chosen city |
| `weather` | `CurrentWeather \| null` | Weather data for selected city |
| `weatherStatus` | `'idle' \| 'loading' \| 'success' \| 'error'` | For loading skeleton / error display |
| `weatherError` | `string \| null` | Error message for Snackbar |
| `overlayOpen` | `boolean` | Search overlay visibility |
| `initialQuery` | `string` | Pre-seeded search term from keyboard shortcut |
| `sameNameCities` | `LocationWithWeather[]` | Same-name cities with their weather |
| `sameNameLoading` | `boolean` | Loading state for same-name batch fetch |

There is no global state store — all state is local to `App.tsx`. Context is only used for the color mode (dark/light theme).

---

## Git Evolution

The app was built across **24 commits** in a single development session. Major phases:

1. **Foundation** — Vite scaffold → Leaflet map with search
2. **Server** — Express server with `/locations` and `/weather` endpoints
3. **UI iteration** — Full-screen map → overlay search → printable key trigger → dark mode
4. **Production** — Static serving from Express, root dev scripts, `node_modules` git cleanup
5. **Polish** — Loading skeleton → same-name city cards → in-memory rotation → visible search bar

The current HEAD is commit `4571406` ("refactor(ui): remove ⌘K shortcut, update search bar placeholder").

---

## Source Map

| Layer | Key Files |
|---|---|
| Server entry | `/server/src/index.ts` |
| Server config | `/server/src/config.ts` |
| Routes | `/server/src/routes/locations.ts`, `/server/src/routes/weather.ts` |
| Services | `/server/src/services/geocoding.ts`, `/server/src/services/forecast.ts` |
| Error handling | `/server/src/errors.ts` |
| Types (shared) | `/server/src/types.ts` |
| Frontend entry | `/weather/src/main.tsx` |
| App component | `/weather/src/App.tsx` |
| API client | `/weather/src/api.ts` |
| Components | `/weather/src/components/` (6 components) |
| Map hook | `/weather/src/hooks/useMap.ts` |
| Color mode context | `/weather/src/ColorModeContext.tsx` |
| Theme | `/weather/src/theme.ts` |
| Types (frontend) | `/weather/src/types.ts` |
