# Weather Map

A clean, minimal map viewer for the weather app. Search for a city, pick the
right match from a disambiguated list, and see it on an interactive Leaflet map.

This is the frontend portion of the weather app. See the [root README](../README.md)
for the full-stack setup including the Express server.

## Stack

- Vite + React 19 + TypeScript
- Material UI 6+ for components and states
- Leaflet 1.9 (vanilla, via a `useMap` hook) with CartoDB light tiles
- Open-Meteo API proxied through the local server

## Getting started

```bash
cd weather
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

The Vite dev server proxies `/locations` and `/weather` to the backend
(`http://localhost:3001`). Start the server first if you want the full
experience, or run the client standalone — `searchLocations` in `src/api.ts`
will fall back relative and fail gracefully if the server isn't running.

## Scripts

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR           |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally         |
| `npm run lint`    | Run ESLint                                    |

## How it works

1. Type a city name in the search bar and submit.
2. The client calls `GET /locations?q=<term>` on the local server, which proxies
   the Open-Meteo Geocoding API and returns up to 10 matches.
3. Each match shows the country flag, admin region, population, and coordinates
   so same-name cities can be told apart.
4. Selecting a match drops a marker on the map, pans/zooms to it, and opens a
   popup with the city name and coordinates.
5. Loading, empty, and error states are shown with MUI components — never a
   blank screen.
6. Weather data fetching is wired in `src/api.ts` (`fetchWeather`) — the UI
   panel is coming in a follow-up round.

## Notes

- The map uses CartoDB `light_all` tiles for a calm, low-contrast basemap.
- Leaflet's default marker icon paths are fixed in `src/main.tsx` to work under
  Vite's bundler.
- All API calls are centralized in `src/api.ts`.
