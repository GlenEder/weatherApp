# Leaflet Marker Icons Guide

## The Default Icon Problem

Leaflet's default marker icon (`L.Icon.Default`) references PNG images shipped with the npm package. Web bundlers (Vite, webpack) often can't resolve those paths, resulting in broken marker images.

## Fix Options

### Option 1: CDN URLs (Recommended — no extra files)

Apply once at app entry (`main.tsx` or `src/mapSetup.ts`):

```typescript
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
```

### Option 2: Copy Files to Public Dir

```bash
cp node_modules/leaflet/dist/images/marker-icon.png weather/public/images/
cp node_modules/leaflet/dist/images/marker-icon-2x.png weather/public/images/
cp node_modules/leaflet/dist/images/marker-shadow.png weather/public/images/
```

Then in code:

```typescript
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});
```

### Option 3: Import via Vite (bundler-based)

```typescript
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
```

## Custom Icons with L.Icon

```typescript
const customIcon = L.icon({
  iconUrl: '/icons/weather-sunny.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});
```

## Custom Icons with L.divIcon (No Image Files)

Best for dynamic content like weather data labels:

```typescript
const tempIcon = L.divIcon({
  className: 'temp-marker', // custom CSS class — set to empty to fully control the HTML
  html: `<div style="
    background: #4A90D9;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  ">22°C</div>`,
  iconSize: [60, 28],
  iconAnchor: [30, 14],
});
```

### L.divIcon Tips

- Set `className: ''` to avoid Leaflet's default `leaflet-div-icon` styles (transparent background)
- Always set `iconSize` and `iconAnchor` for proper positioning
- Use inline styles for prototype, CSS classes for production
- Works great for weather badges, counts, and labels

## Full Icon Type Reference

| Property | Description | Default |
|----------|-------------|---------|
| `iconUrl` | Image URL | Built-in marker-icon.png |
| `iconRetinaUrl` | 2x resolution image | Built-in marker-icon-2x.png |
| `iconSize` | Image size `[w, h]` | `[25, 41]` |
| `iconAnchor` | Anchor point `[x, y]` from top-left | `[12, 41]` (tip at bottom-center) |
| `popupAnchor` | Popup offset from iconAnchor | `[0, -41]` (above icon) |
| `shadowUrl` | Shadow image URL | Built-in marker-shadow.png |
| `shadowSize` | Shadow size | `[41, 41]` |
| `shadowAnchor` | Shadow anchor | `[12, 41]` |
| `tooltipAnchor` | Tooltip offset | `[0, 0]` |
| `className` | CSS class for the icon element | `''` |
