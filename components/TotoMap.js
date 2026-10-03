'use client';
// components/TotoMap.js — Leaflet map showing College, Station, and Office stops with live toto dot

import { useEffect, useRef } from 'react';

// Exact coordinates for stops provided by user
export const PLACES = {
  'College': { lat: 24.2848,  lng: 87.2638,  label: '🎓 College' },
  'Station': { lat: 24.28944, lng: 87.2550,  label: '🚉 Station' },
  'Office':  { lat: 24.27409, lng: 87.24695, label: '🏢 Office' },
};

const STOPS = PLACES;

export default function TotoMap({ riderLocation, from, to, height = 320 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet
    import('leaflet').then(L => {
      // Fix default icon path for Next.js
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;
      if (mapInstanceRef.current) return; // already initialized

      const fromStop = STOPS[from] || STOPS['College'];
      const toStop   = STOPS[to]   || STOPS['Office'];

      const map = L.map(mapRef.current, { zoomControl: true }).setView(
        [(fromStop.lat + toStop.lat) / 2, (fromStop.lng + toStop.lng) / 2],
        14
      );

      mapInstanceRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Route polyline
      const routeLine = L.polyline(
        [[fromStop.lat, fromStop.lng], [toStop.lat, toStop.lng]],
        { color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '8 4' }
      ).addTo(map);

      // Stop markers
      const stopIcon = (emoji) => L.divIcon({
        html: `<div style="font-size:1.5rem;line-height:1;">${emoji}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([fromStop.lat, fromStop.lng], { icon: stopIcon('📍') })
        .addTo(map)
        .bindPopup(`<strong>${fromStop.label}</strong>`);

      L.marker([toStop.lat, toStop.lng], { icon: stopIcon('🏁') })
        .addTo(map)
        .bindPopup(`<strong>${toStop.label}</strong>`);

      // Toto marker
      const totoIcon = L.divIcon({
        html: `<div style="font-size:1.75rem;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));">🛺</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (riderLocation?.lat && riderLocation?.lng) {
        const m = L.marker([riderLocation.lat, riderLocation.lng], { icon: totoIcon })
          .addTo(map)
          .bindPopup('Toto is here!');
        markerRef.current = m;
      }

      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [from, to]);

  // Update toto position without re-initializing map
  useEffect(() => {
    if (!mapInstanceRef.current || !riderLocation?.lat) return;

    import('leaflet').then(L => {
      const pos = [riderLocation.lat, riderLocation.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        const totoIcon = L.divIcon({
          html: `<div style="font-size:1.75rem;line-height:1;">🛺</div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 18],
        });
        markerRef.current = L.marker(pos, { icon: totoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('Toto is here!');
      }
    });
  }, [riderLocation]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
        className="map-container"
        style={{ height }}
        id="toto-map"
      />
    </>
  );
}
