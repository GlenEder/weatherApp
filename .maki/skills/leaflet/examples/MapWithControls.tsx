import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapWithControlsProps {
  center?: [number, number];
  zoom?: number;
}

export function MapWithControls({ center = [51.505, -0.09], zoom = 6 }: MapWithControlsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeLayer, setActiveLayer] = useState<'street' | 'topo'>('street');

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current!, { center, zoom });

    // --- Base layers ---
    const streetMap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );

    const topoMap = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution:
          '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> ' +
          '<a href="https://opentopomap.org">OpenTopoMap</a>',
      },
    );

    streetMap.addTo(map);

    // --- Layer control ---
    const baseLayers = {
      Street: streetMap,
      Topographic: topoMap,
    };

    L.control.layers(baseLayers).addTo(map);

    // --- Scale control ---
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    // --- Geolocation button ---
    const geoButton = L.control({ position: 'topleft' });

    geoButton.onAdd = () => {
      const btn = document.createElement('button');
      btn.innerHTML = '📍';
      btn.title = 'Find my location';
      btn.style.cssText =
        'background: white; border: 2px solid rgba(0,0,0,0.2); border-radius: 4px; ' +
        'padding: 6px 10px; font-size: 18px; cursor: pointer; line-height: 1;';

      btn.onclick = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserLocation(latlng);
            map.flyTo(latlng, 13);

            L.marker(latlng)
              .addTo(map)
              .bindPopup('You are here!')
              .openPopup();
          },
          () => {
            alert('Geolocation failed or was denied.');
          },
        );
      };

      return btn;
    };

    geoButton.addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Track active layer for UI indicator
  useEffect(() => {
    if (!mapInstance.current) return;

    mapInstance.current.on('baselayerchange', (e: L.LayersControlEvent) => {
      setActiveLayer(e.name === 'Topographic' ? 'topo' : 'street');
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 14, color: '#666' }}>
        Active layer: <strong>{activeLayer === 'street' ? 'Street' : 'Topographic'}</strong>
        {userLocation && (
          <span style={{ marginLeft: 16 }}>
            Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
          </span>
        )}
      </div>
      <div
        ref={mapRef}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      />
    </div>
  );
}
