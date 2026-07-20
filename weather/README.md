# Weather Map

A clean, minimal map viewer for the weather app. Search for a city, pick the
right match from a disambiguated list, and see it on an interactive Leaflet map.

This is the first slice of the app described in [`docs/user_story.md`](../docs/user_story.md):
search → disambiguate → select → view on map. The Express server, weather
details, mobile responsiveness, and tests are deferred to later rounds.

## Stack

- Vite + React 19 + TypeScript
- Material UI 6+ for components and states
- Leaflet 1.9 (vanilla, via a `useMap` hook) with CartoDB light tiles
- Open-Meteo Geocoding API (no API key required) called directly from the client

## Getting started

```bash
cd weather
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Scripts

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR           |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally         |
| `npm run lint`    | Run ESLint                                    |

## How it works

1. Type a city name in the search bar and submit.
2. The client calls the Open-Meteo Geocoding API and lists up to 10 matches,
   each showing the country flag, admin region, population, and coordinates so
   same-name cities can be told apart.
3. Selecting a match drops a marker on the map, pans/zooms to it, and opens a
   popup with the city name and coordinates.
4. Loading, empty, and error states are shown with MUI components — never a
   blank screen.

## Notes

- The map uses CartoDB `light_all` tiles for a calm, low-contrast basemap.
- Leaflet's default marker icon paths are fixed in `src/main.tsx` to work under
  Vite's bundler.
- All geocoding calls are centralized in `src/api.ts`, so swapping the direct
  API call for a local server proxy later is a one-file change.
