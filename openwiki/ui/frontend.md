# Frontend (UI)

The frontend is a **React 19 + TypeScript** application built with **Vite 8**, **Material UI 9**, and **Leaflet 1.9** for the map. Components are primarily function components with hooks, and all application state lives in `App.tsx`.

---

## Component Tree

```
main.tsx
└── ColorModeProvider                     # Dark/light theme context
    └── ThemeProvider (lightTheme | darkTheme)  # MUI theme
        └── CssBaseline                   # MUI CSS reset
            └── App                       # All state, all business logic
                ├── MapView               # Full-screen Leaflet map
                ├── [WeatherCard]         # Fixed bottom-left
                │   └── [Skeleton]        # Loading state of WeatherCard
                ├── SameNameCityCards     # Horizontal scroll, bottom
                ├── SearchInput           # Fixed top-center (read-only trigger)
                ├── Snackbar              # Error toast, bottom-right
                ├── OverlaySearchBar      # Modal with backdrop
                └── ThemeToggle           # Fixed bottom-right
```

---

## State Management

All application state is local to `App.tsx` using `useState`. No Redux, no Zustand — just React built-ins.

| State | Type | Purpose |
|---|---|---|
| `selected` | `Location \| null` | Currently chosen city (drives map marker + weather) |
| `weather` | `CurrentWeather \| null` | Weather data for the selected city |
| `weatherStatus` | `'idle' \| 'loading' \| 'success' \| 'error'` | Controls skeleton vs card vs error |
| `weatherError` | `string \| null` | Error message string for Snackbar |
| `overlayOpen` | `boolean` | Search overlay visibility |
| `initialQuery` | `string` | Pre-seeded term when overlay opens via keypress |
| `sameNameCities` | `LocationWithWeather[]` | Same-name cities with weather for bottom cards |
| `sameNameLoading` | `boolean` | Loading indicator for same-name batch fetch |

The only **React Context** is `ColorModeContext` for dark/light theme switching.

---

## Search UX Flow

### Trigger
1. **Click** the always-visible `SearchInput` bar at top center
2. **Type any printable key** anywhere on the page — a global `keydown` listener opens the overlay with that character pre-seeded
3. **Modifier keys** (Ctrl, Meta, Alt), focus in `<input>`/`<textarea>`, and special keys are ignored

### Overlay (`OverlaySearchBar`)
- Full-screen backdrop with blur effect, click-to-close, Escape key
- `SearchInput` at top of centered panel
- 300ms debounce on input → `searchLocations(term)` from `api.ts`
- `AbortController` cancels in-flight requests on new input
- Results rendered in MUI `List` with `ListItemButton` — primary text (city name), secondary text (admin1, country)
- **States**: Loading (`CircularProgress`), Empty (`Alert severity="info"`), Error (`Alert severity="error"`), Results (scrollable list)

### Selection
Choosing a location calls `handleSelect(loc)` which:
1. Sets `selected` and `weatherStatus = 'loading'`
2. Calls `fetchWeather(lat, lon)` → populates `weather` (or `weatherError` on failure)
3. Fires `loadSameNameCities(loc)` to discover same-name cities
4. Overlay closes

---

## Map Integration (`useMap` hook + `MapView`)

The map is managed by a custom hook at `/weather/src/hooks/useMap.ts`:

- **Creates**: A single `L.map` instance on mount (guarded against double-init)
- **Default**: Center `[20, 0]`, zoom 2
- **Tiles**: CartoDB basemaps — `light_all` (light mode) / `dark_all` (dark mode)
- **Dark mode switch**: `setDarkMode(dark)` removes old tile layer and adds the new one
- **Cleanup**: `map.remove()` on unmount

`MapView` renders a `<div>` ref and connects the hook to the `location` prop:
- When `location` changes, calls `map.flyTo(lat, lng, zoom=11, duration=1.2s)`
- Creates/updates a marker with an HTML popup (escaped city name + coordinates)
- Watches `mode` from `ColorModeContext` → calls `setDarkMode`

The default marker icon is fixed in `main.tsx` (Leaflet bundler workaround) by overriding icon URLs to the unpkg CDN.

---

## Weather Display

### WeatherCard
- Fixed bottom-left MUI `Card` with elevation
- Shows: city + admin1, large temperature, condition description, feels-like, humidity, wind, precipitation
- Close button (top-right) calls `onClose` which clears all weather state

### Loading State
While `weatherStatus === 'loading'`, a `Skeleton`-based card placeholder appears at the same position with matching layout.

### SameNameCityCards
- Horizontal scrollable row of compact cards positioned bottom (starting left=420px from WeatherCard)
- Each card shows: city name + admin/country, temperature, condition
- Cards are interactive — clicking one calls `handleSameNameSelect` which **swaps** the clicked city to the main selection and moves the old selection into the cards
- All data is rotated **in memory** — no API calls
- Loading state renders 3 skeleton cards
- Fetches up to 6 same-name cities in parallel with `Promise.allSettled`, filtering to fulfilled results only

### Error State
Errors are shown via a MUI `Snackbar` (filled, red, bottom-right, 6-second auto-hide).

---

## Dark Mode

**Implementation at `/weather/src/ColorModeContext.tsx`:**

- **Initialization**: Checks `localStorage` → `prefers-color-scheme` media query → defaults to `'light'`
- **Persistence**: On every mode change, writes to `localStorage` and toggles `document.body.classList('dark')`
- **Theme**: Two MUI `createTheme` calls (`lightTheme` / `darkTheme`), swapped via `useMemo` in `ThemedApp`
- **CSS custom properties**: The `body.dark` class triggers `--search-hint-*` overrides in `index.css`
- **Leaflet dark overrides**: `index.css` targets `.leaflet-popup-*`, `.leaflet-bar`, `.leaflet-control-attribution` under `body.dark`

**Components**:
- `ThemeToggle` — fixed bottom-right MUI `IconButton` with sun/moon icons and Tooltip
- `SearchInput` — reads `useColorMode()` to apply dark inline styles

---

## API Client (`/weather/src/api.ts`)

All server communication is centralized in `api.ts`:

| Function | HTTP Call | Returns |
|---|---|---|
| `searchLocations(term)` | `GET /locations?q=<term>` | `Location[]` |
| `fetchWeather(lat, lon, units?)` | `GET /weather?lat=...&lon=...` | `CurrentWeather` |
| `fetchSameNameLocations(name, excludeId)` | Calls `searchLocations` + filters | `Location[]` |
| `fetchBatchWeather(locations)` | Up to 6 parallel `fetchWeather` calls | `LocationWithWeather[]` |

**Base URL**: Controlled by `VITE_API_BASE` env var (defaults to empty string → uses Vite dev proxy).

**Error handling**: A custom `ApiError` class wraps all failures with descriptive messages. Three layers of error catching per function:
1. Network errors → `"Network error while..."` 
2. Non-OK responses → parse server error body, fall back to HTTP status text
3. JSON parse failures → `"Received an invalid response..."`

---

## Styling Approach

- **MUI `sx` prop** for component-level styling (inline, theme-aware)
- **`index.css`** for global resets, custom properties (search hint, dark mode), and Leaflet dark overrides
- **`App.css`** — minimal (`.app-root` positioning only)
- **CSS custom properties** with `body.dark` class switching for theme-aware values
- CSS transitions on `background-color` and `color` for smooth theme switching

---

## Testing

**Framework**: Vitest 4 with jsdom environment  
**Setup file**: `/weather/src/test/setup.ts` — imports `@testing-library/jest-dom` matchers, polyfills `localStorage`

**Test files** (co-located with components):

| File | What It Tests |
|---|---|
| `WeatherCard.test.tsx` | Rendering (name, temp, condition, details), close button interaction |
| `SameNameCityCards.test.tsx` | Empty state, loading skeletons, rendered cards, click-to-select |
| `OverlaySearchBar.test.tsx` | Open/close, backdrop click, Escape key, loading/empty/error states, selection |
| `ThemeToggle.test.tsx` | Toggle behavior, localStorage persistence, system preference, aria labels |
| `ColorModeContext.test.tsx` | Default mode, toggle, localStorage read, provider guard |
| `App.test.tsx` | Integration — map render, search triggers, overlay, loading skeleton, weather card, error snackbar, same-name lookup |

**Testing patterns**:
- Components wrapped in `<ColorModeProvider>` when they use `useColorMode()`
- API functions mocked with `vi.mock('../api')` for overlay tests
- `vi.fn()` for callback props
- `vi.stubGlobal('matchMedia', ...)` for system preference tests
- `renderHook` + `act`/`waitFor` for context tests
- `fireEvent` and `userEvent` for interactions

---

## Dependencies

**Production**: `react` (^19.2.7), `react-dom` (^19.2.7), `@mui/material` (^9.2.0), `@mui/icons-material` (^9.2.0), `@emotion/react` (^11.14.0), `@emotion/styled` (^11.14.1), `leaflet` (^1.9.4), `@types/leaflet` (^1.9.21)

**Dev**: `vite` (^8.1.1), `vitest` (^4.1.10), `typescript` (~6.0.2), `@vitejs/plugin-react` (^6.0.3), `jsdom` (^29.1.1), `@testing-library/*`, `eslint` + plugins
