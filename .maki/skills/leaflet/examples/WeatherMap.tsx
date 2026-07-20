import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Temperature color scale ---
function tempColor(tempC: number): string {
  if (tempC >= 40) return '#8B0000';
  if (tempC >= 30) return '#FF4500';
  if (tempC >= 20) return '#FF8C00';
  if (tempC >= 10) return '#FFD700';
  if (tempC >= 0) return '#1E90FF';
  if (tempC >= -10) return '#4682B4';
  return '#191970';
}

function tempColorHex(tempC: number): string {
  return tempColor(tempC);
}

// --- Types ---
export interface WeatherPoint {
  id: string;
  lat: number;
  lng: number;
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  name?: string;
}

interface WeatherMapProps {
  center: [number, number];
  zoom?: number;
  dataPoints: WeatherPoint[];
}

export function WeatherMap({ center, zoom = 6, dataPoints }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current!, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> ' +
        '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    markerLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!markerLayer.current) return;

    markerLayer.current.clearLayers();

    dataPoints.forEach((point) => {
      const color = tempColorHex(point.temperature);

      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 10,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1,
        color: '#fff',
        opacity: 0.8,
      });

      marker.bindTooltip(
        `<strong>${point.name ?? 'Unknown'}</strong><br>` +
          `${point.temperature}°C | ${point.condition}` +
          (point.humidity !== undefined ? `<br>Humidity: ${point.humidity}%` : '') +
          (point.windSpeed !== undefined ? `<br>Wind: ${point.windSpeed} m/s` : ''),
        { direction: 'top' },
      );

      marker.addTo(markerLayer.current!);
    });

    // Update center if data changes
    if (dataPoints.length > 0 && mapInstance.current) {
      mapInstance.current.setView(center, zoom);
    }
  }, [dataPoints, center, zoom]);

  // Update view when center changes (e.g. new search)
  useEffect(() => {
    mapInstance.current?.setView(center, zoom);
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    />
  );
}
