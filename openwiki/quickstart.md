# Weather App — Quickstart

Full-stack weather application: search any city, disambiguate same-name matches, view the location on a Leaflet map, and see current weather conditions. No API key required — data is proxied from the free [Open-Meteo](https://open-meteo.com/) APIs.

> **Source**: Original user story at [`/docs/user_story.md`](/docs/user_story.md).

---

## Repository Structure

```
weatherApp/
├── package.json          # Root: dev/build/test orchestration via concurrently
├── README.md             # Full project README
├── docs/
│   ├── user_story.md     # Original requirements
│   └── README.md         # (empty)
├── server/               # Express + TypeScript backend
│   └── src/
│       ├── index.ts          # Express app, SPA serving in production
│       ├── config.ts         # Environment configuration
│       ├── errors.ts         # ApiError + errorHandler middleware
│       ├── types.ts          # Shared TypeScript types
│       ├── routes/           # locations.ts, weather.ts (Zod validation)
│       ├── services/         # geocoding.ts, forecast.ts (Open-Meteo proxies)
│       └── __tests__/        # 4 test files (Jest + supertest)
├── weather/              # React + Vite + TypeScript frontend
│   └── src/
│       ├── App.tsx           # Main app with state management
│       ├── api.ts            # API client functions
│       ├── ColorModeContext  # Dark mode with localStorage persistence
│       ├── components/       # MapView, WeatherCard, SameNameCityCards,
│       │                     # OverlaySearchBar, SearchInput, ThemeToggle
│       ├── hooks/useMap.ts   # Leaflet map lifecycle + tile switching
│       └── test/             # Vitest setup
└── .maki/skills/leaflet/     # AI agent skill resources for Leaflet
```

---

## Quick Start

### Prerequisites

- Node.js >= 20
- npm

### 1. Start the backend

```bash
cd server
npm install
npm run dev        # Starts on http://localhost:3001 with tsx watch
```

| Script | Purpose |
|---|---|
| `npm run dev` | Hot-reload dev server (`tsx watch`) |
| `npm run build` | Compile TS to `dist/` |
| `npm start` | Run compiled JS |
| `npm test` | Run Jest test suite (30 tests) |

### 2. Start the frontend

```bash
cd weather
npm install
npm run dev        # Starts on http://localhost:5173 with Vite HMR
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest run |
| `npm run test:watch` | Vitest watch mode |

Open `http://localhost:5173` in your browser. The Vite dev server proxies `/locations` and `/weather` requests to the backend at `localhost:3001`.

### 3. Run everything together

```bash
npm run dev    # From root — starts both server and client via concurrently
```

---

## How It Works

1. Type a city name in the always-visible search bar (top center), or press any printable key to open the search overlay.
2. The client sends `GET /locations?q=<term>` to the Express server.
3. The server proxies to the Open-Meteo Geocoding API and returns up to 10 matches with disambiguation detail (country, admin region, population, coordinates).
4. Results appear in a scrollable list. Pick the correct city.
5. A marker drops on the full-screen Leaflet map at that city's coordinates (fly-to animation).
6. A **WeatherCard** appears at bottom-left showing temperature, feels-like, condition, humidity, wind, and precipitation.
7. **Same-name cities** (e.g., other "Springfield"s) automatically appear as compact cards at the bottom of the viewport. Click one to swap — no additional API calls.
8. Toggle dark mode via the bottom-right button; the setting persists in `localStorage`.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /locations?q=<term>` | Search cities — proxies Open-Meteo Geocoding |
| `GET /weather?lat=<>&lon=<>&units=imperial` | Current weather — proxies Open-Meteo Forecast |
| `GET /health` | Health check — returns `{ "status": "ok" }` |

Full request/response schemas are documented in the [API Reference](/README.md#server-endpoints) (root README) and the [Integrations](/openwiki/integrations/apis.md) page.

---

## Environment Variables

**Server (`server/`):**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `GEOCODING_BASE_URL` | `https://geocoding-api.open-meteo.com/v1` | Upstream geocoding base |
| `FORECAST_BASE_URL` | `https://api.open-meteo.com/v1` | Upstream forecast base |
| `DEFAULT_UNITS` | `imperial` | `imperial` or `metric` |
| `REQUEST_TIMEOUT_MS` | `5000` | Upstream request timeout |

**Client (`weather/`):**

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE` | (empty) | API base URL; set to `http://localhost:3001` to bypass Vite proxy |

---

## Testing

```bash
npm test    # From root — runs both server and client test suites
```

- **Server**: 30 tests — Jest + supertest. Service-level tests mock `fetch`; route-level tests mock services.
- **Client**: ~14+ tests — Vitest + React Testing Library. Co-located with components.
- All external I/O is mocked; no network or database required.

---

## Key Documentation Pages

| Page | What It Covers |
|---|---|
| [Architecture Overview](/openwiki/architecture/overview.md) | System design, data flow, routing, component interaction |
| [Server (Backend)](/openwiki/server/backend.md) | Express app, routes, services, config, error handling, testing patterns |
| [Frontend (UI)](/openwiki/ui/frontend.md) | React component tree, state management, theming, Leaflet map, search UX |
| [Integrations (APIs)](/openwiki/integrations/apis.md) | Open-Meteo proxy pattern, URL building, units, error mapping per API |
| [Operations & Deployment](/openwiki/operations/deployment.md) | Build pipeline, production mode, env vars, dev workflow scripts |

---

## Change Guidance for Future Agents

- **Adding a new API route**: Create a route file in `server/src/routes/`, add Zod schema validation, wire in `index.ts`. Add a service file in `server/src/services/` if proxying an upstream. Create tests for both.
- **Adding a new UI component**: Co-locate the component `.tsx` and `.test.tsx` in `weather/src/components/`. Use MUI components for layout/states. Wrap tests consuming `useColorMode` in `<ColorModeProvider>`.
- **Modifying the search flow**: `OverlaySearchBar` handles debounced search + results list. `App.tsx` manages the overlay open/close state. `api.ts` contains all API client functions.
- **Modifying the same-name cards flow**: `loadSameNameCities` in `App.tsx` re-searches by name, fetches batch weather, and updates state. `SameNameCityCards` renders the horizontal scroll. In-memory rotation happens in `handleSameNameSelect` — no API calls.
- **Dark mode**: Color mode is managed via `ColorModeContext` (localStorage + `prefers-color-scheme`). The `body.dark` CSS class triggers CSS custom properties and Leaflet dark overrides.
- **Testing**: Server tests use Jest + supertest. Client tests use Vitest + React Testing Library. Mock external APIs at the fetch/service boundary, not with HTTP fixtures.
