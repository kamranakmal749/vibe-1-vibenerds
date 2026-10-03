// lib/places.js — Shared Places Coordinates and Route Distances

export const PLACES = Object.freeze({
  College: { lat: 24.2848,  lng: 87.2638,  label: 'College' },
  Station: { lat: 24.28944, lng: 87.2550,  label: 'Station' },
  Office:  { lat: 24.27409, lng: 87.24695, label: 'Office' },
});

const ROUTE_DISTANCES = {
  'College-Station': '1.3 km',
  'Station-College': '1.3 km',
  'Station-Office':  '2.5 km',
  'Office-Station':  '2.5 km',
  'College-Office':  '2.7 km',
  'Office-College':  '2.7 km',
};

export function getRouteDistance(from, to) {
  if (!from || !to) return '';
  const key = `${from}-${to}`;
  return ROUTE_DISTANCES[key] || '2.0 km';
}

export function getDirectionsUrl(from, to) {
  const fromPlace = PLACES[from];
  const toPlace = PLACES[to];
  if (!fromPlace || !toPlace) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/dir/?api=1&origin=${fromPlace.lat},${fromPlace.lng}&destination=${toPlace.lat},${toPlace.lng}&travelmode=driving`;
}

export function getOsmEmbedUrl(from, to) {
  const fromPlace = PLACES[from];
  const toPlace = PLACES[to];
  if (!fromPlace || !toPlace) return '';

  const pad = 0.003;
  const minLat = Math.min(fromPlace.lat, toPlace.lat) - pad;
  const maxLat = Math.max(fromPlace.lat, toPlace.lat) + pad;
  const minLng = Math.min(fromPlace.lng, toPlace.lng) - pad;
  const maxLng = Math.max(fromPlace.lng, toPlace.lng) + pad;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${toPlace.lat},${toPlace.lng}`;
}
