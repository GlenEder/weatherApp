# Leaflet Tile Provider Reference

## Base Map Tiles

| Provider | URL | Max Zoom | Notes |
|----------|-----|----------|-------|
| OpenStreetMap | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | 19 | Default, no API key |
| CartoDB Light | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` | 20 | Clean look, good for overlays |
| CartoDB Dark | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | 20 | Good for dark mode UIs |
| OpenTopoMap | `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` | 17 | Topographic, no API key |
| Satellite (ESRI) | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | 19 | Satellite imagery |

## Attribution Strings

```typescript
// OpenStreetMap
'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// CartoDB
'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'

// OpenTopoMap
'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, <a href="https://opentopomap.org">OpenTopoMap</a>'

// ESRI Satellite
'&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, ...'
```

## Weather Overlay Tiles

These require an [OpenWeatherMap API key](https://openweathermap.org/api) (free tier available).

| Layer | URL Pattern |
|-------|-------------|
| Temperature | `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid={API_KEY}` |
| Clouds | `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid={API_KEY}` |
| Precipitation | `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={API_KEY}` |
| Wind Speed | `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid={API_KEY}` |
| Pressure | `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid={API_KEY}` |

### Usage Pattern

```typescript
const tempOverlay = L.tileLayer(
  'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
  { opacity: 0.5, maxZoom: 18 },
);

// Add to an existing map
tempOverlay.addTo(map);

// Toggle on/off with layer control
L.control.layers({
  'Street Map': streetLayer,
}, {
  'Temperature': tempOverlay,
}).addTo(map);
```

## Free Weather Tile Alternatives

| Service | Description | Limits |
|---------|-------------|--------|
| [Open-Meteo](https://open-meteo.com/) | No API key needed, but tiles require self-hosting via their API data | 10,000 req/day free |
| [WeatherAPI.com](https://www.weatherapi.com/) | Free tier includes static weather maps | 1M calls/month free |
| [RainViewer](https://www.rainviewer.com/api.html) | Free radar overlay tiles, no API key | Unlimited (radar only) |

### RainViewer (No API Key)

```typescript
// Fetch available radar frames
const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
const data = await response.json();

// Get the latest radar frame
const frame = data.radar.past.slice(-1)[0];

const radarLayer = L.tileLayer(
  `https://tilecache.rainviewer.com/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`,
  { opacity: 0.4 },
);

radarLayer.addTo(map);
```

## Tile URL Gotchas

1. **HTTPS required** — Most modern browsers block mixed content; always use `https://`
2. **Subdomain `{s}`** — Browsers limit parallel connections per domain; subdomains like `a`, `b`, `c` improve tile loading speed
3. **`{r}` suffix** — Some providers (CartoDB) need the `{r}` for retina displays
4. **Rate limits** — Tile providers may rate-limit excessive requests; cache tiles when possible
5. **Attribution is mandatory** — Most tile licenses require visible attribution on the map
