---
name: leaflet
description: Guides using Leaflet for interactive maps in a React + Vite + TypeScript project. Covers map setup, tile layers, markers, weather overlays, and React integration. Not for Mapbox, Google Maps, or non-React Leaflet usage.
compatibility: opencode
allowed-tools: read,write,edit,multiedit,batch,bash,glob,grep,index,code_execution,websearch,webfetch
---

## Purpose

Provides instructions and patterns for using Leaflet in this React + Vite + TypeScript weather app project. Covers map initialization, tile providers, marker/overlay patterns, weather data visualization, and React component integration.

**Use when:** adding new maps, updating map features, troubleshooting Leaflet rendering, or building weather visualizations.

**Do NOT use for:** Google Maps, Mapbox GL, non-map visualizations, or backend-only tasks.

## Prerequisites

Leaflet is already a dependency at the repository root (`package.json`). The weather app lives in `weather/` and does NOT yet list leaflet or @types/leaflet in its own `package.json`. When adding Leaflet imports to the weather app, install:

```bash
cd weather && npm install leaflet && npm install -D @types/leaflet
```

## Setup Checklist

Every time you add Leaflet to a new component, verify:

1. **Leaflet CSS is imported** — `import 'leaflet/dist/leaflet.css'` (in the component or main entry)
2. **Map container has explicit height** — Leaflet needs a container with a defined CSS height
3. **Map instance is destroyed on unmount** — always clean up with `map.remove()`
4. **Marker icon paths are fixed** — Leaflet's default marker icon breaks in bundlers; use the fix below

### Default Marker Icon Fix

Leaflet's default icon images break with Vite/webpack. Apply this fix once (e.g. in `main.tsx` or a shared `mapSetup.ts`):

```typescript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
```

Alternatively, copy the marker images from `node_modules/leaflet/dist/images/` into `weather/public/images/`.

## Map Initialization

### Basic Map Component

```typescript
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
}

function Map({ center, zoom = 10 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapRef.current!, {
      center,
      zoom,
      zoomControl: true,
    });

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // empty deps — map initializes once

  // Update center/zoom when props change
  useEffect(() => {
    mapInstanceRef.current?.setView(center, zoom);
  }, [center, zoom]);

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />;
}
```

### Map Container CSS

The map div MUST have a defined height. Never leave it as `height: 0` or auto. Common patterns:

```css
/* Fixed height */
.map-container { height: 500px; width: 100%; }

/* Responsive — fills parent */
.map-container { height: 100%; width: 100%; }
.map-wrapper { height: 60vh; }

/* Full page */
.map-container { height: 100vh; width: 100vw; }
```

## Tile Layers

### OpenStreetMap (Default)

```typescript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
});
```

### CartoDB (Cleaner look, good for weather overlays)

```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
});
```

### OpenWeatherMap Temperature Tiles (requires API key)

```typescript
L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid={apiKey}', {
  maxZoom: 18,
  opacity: 0.5,
  attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
});
```

## Markers & Popups

### Simple Marker

```typescript
const marker = L.marker([lat, lng])
  .addTo(map)
  .bindPopup('<b>City Name</b><br>Temperature: 22°C');
```

### Custom Icon

```typescript
const weatherIcon = L.divIcon({
  className: 'weather-marker',
  html: `<div style="background: #4A90D9; color: white; padding: 4px 8px; border-radius: 4px;">22°C</div>`,
  iconSize: [80, 30],
  iconAnchor: [40, 15],
});

L.marker([lat, lng], { icon: weatherIcon }).addTo(map);
```

### Circle Markers for Weather Data

```typescript
L.circleMarker([lat, lng], {
  radius: 8,
  fillColor: '#ff7800',
  color: '#000',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
}).addTo(map).bindTooltip('22°C');
```

## Weather Data Overlays

### Heatmap-Style with CircleMarkers

For weather station data, use colored circle markers based on values:

```typescript
function getColor(temp: number): string {
  return temp > 30 ? '#c0392b'
    : temp > 20 ? '#e67e22'
    : temp > 10 ? '#f1c40f'
    : temp > 0  ? '#3498db'
    : '#2c3e50';
}

// For each data point
weatherData.forEach(point => {
  L.circleMarker([point.latitude, point.longitude], {
    radius: 10,
    fillColor: getColor(point.temperature),
    fillOpacity: 0.7,
    weight: 0,
  }).addTo(map).bindTooltip(`${point.temperature}°C`);
});
```

### GeoJSON for Polygon Data

```typescript
import geoData from './regions.json';

L.geoJSON(geoData, {
  style: (feature) => ({
    fillColor: getColor(feature.properties.temp),
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.7,
  }),
  onEachFeature: (feature, layer) => {
    layer.bindTooltip(`${feature.properties.name}: ${feature.properties.temp}°C`);
  },
}).addTo(map);
```

## React Integration Patterns

### Custom Hook: useMap

Encapsulate map lifecycle in a reusable hook:

```typescript
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function useMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: { center: [number, number]; zoom?: number }
) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: options.center,
      zoom: options.zoom ?? 10,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return mapRef;
}
```

### Component: WeatherMap

Pattern for rendering weather data on a map:

```typescript
interface WeatherMapProps {
  center: [number, number];
  weatherData: WeatherPoint[];
}

function WeatherMap({ center, weatherData }: WeatherMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const map = useMap(containerRef, { center });

  // Update markers when data changes
  useEffect(() => {
    if (!map.current) return;

    const layerGroup = L.layerGroup().addTo(map.current);

    weatherData.forEach(point => {
      L.circleMarker([point.lat, point.lon], {
        radius: 8,
        fillColor: tempColor(point.temp),
        fillOpacity: 0.7,
        weight: 0,
      })
        .bindTooltip(`${point.temp}°C | ${point.condition}`)
        .addTo(layerGroup);
    });

    return () => {
      layerGroup.clearLayers();
      map.current?.removeLayer(layerGroup);
    };
  }, [weatherData]);

  return (
    <div
      ref={containerRef}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    />
  );
}
```

### Avoiding Common React Pitfalls

| Pitfall | Solution |
|---------|----------|
| Map not rendering (blank div) | Ensure container has explicit CSS height |
| Multiple maps on re-render | Use ref to track initialization; `useEffect` with empty deps |
| Markers not updating | Wrap markers in a `L.layerGroup` and rebuild on data change |
| Memory leaks on unmount | Clean up with `map.remove()` in useEffect return |
| Leaflet CSS missing | Import `leaflet/dist/leaflet.css` |
| Marker icons broken | Apply the default icon fix (see Setup Checklist) |

## Performance Tips

1. **Limit marker count** — Beyond ~500 markers, use clustering (`leaflet.markercluster`)
2. **Use `L.layerGroup`** — Manage groups of markers/overlays that update together
3. **Avoid recreating the map** — Initialize once, update layers/center via refs
4. **Opacity for overlays** — Weather tile overlays at `opacity: 0.5` prevent hiding the basemap
5. **Debounce viewport changes** — When updating data on map move/zoom, debounce requests

## Cleanup Pattern (Always Use)

Every component that creates a Leaflet map MUST clean up:

```typescript
useEffect(() => {
  const map = L.map(container).setView([0, 0], 2);
  L.tileLayer('...').addTo(map);

  return () => {
    map.remove(); // <-- CRITICAL: prevents memory leaks and stale DOM
  };
}, []);
```

## References

- `references/icons.md` — Guide for fixing default Leaflet marker icons and creating custom icons with L.divIcon.
- `references/tile-providers.md` — Tile layer URLs for OpenStreetMap, CartoDB, OpenWeatherMap, and others.

## Examples

- `examples/BasicMap.tsx` — Minimal Leaflet map component in React.
- `examples/WeatherMap.tsx` — Full weather map with markers colored by temperature.
- `examples/MapWithControls.tsx` — Map with layer switcher, zoom controls, and geolocation.

## Edge Cases

| Issue | Cause | Fix |
|-------|-------|-----|
| Map tile grid visible but no tiles | Mixed content (HTTP tile URL on HTTPS page) | Use HTTPS tile URLs |
| Map zooms but tiles don't load | Tile URL template wrong | Verify `{z}/{x}/{y}` format |
| CSS grid/flex makes height 0 | Container has no explicit height | Set `height` on the map container or a parent with `display: flex; flex-direction: column` |
| Marker icon shows as broken image | Bundler can't resolve Leaflet images | Apply the default icon fix (see above) |
| Map renders over modals/dialogs | Leaflet pane z-index conflicts | Set `z-index` on map container lower than modal overlay |
| Touch zoom not working on mobile | Leaflet touch handler conflict | Ensure no `touch-action: none` on parent elements |
