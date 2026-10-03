'use client';
// components/RouteMap.js — SVG Schematic Route Map & Optional OpenStreetMap Embed

import { useState } from 'react';
import { PLACES, getRouteDistance, getDirectionsUrl, getOsmEmbedUrl } from '@/lib/places';
import { ExternalLink, Map, Compass, Navigation } from 'lucide-react';

export default function RouteMap({ from, to, compact = false }) {
  const [showLiveMap, setShowLiveMap] = useState(false);

  if (!from || !to) return null;

  const distance = getRouteDistance(from, to);
  const directionsUrl = getDirectionsUrl(from, to);
  const osmUrl = getOsmEmbedUrl(from, to);

  // Projection math for SVG (viewBox 0 0 400 225)
  const minLat = 24.27409;
  const maxLat = 24.28944;
  const latRange = maxLat - minLat || 1;

  const minLng = 87.24695;
  const maxLng = 87.2638;
  const lngRange = maxLng - minLng || 1;

  const padX = 55;
  const usableW = 290;
  const padY = 40;
  const usableH = 145;

  const project = (lat, lng) => {
    const normX = (lng - minLng) / lngRange;
    const normY = (lat - minLat) / latRange;
    const x = padX + normX * usableW;
    const y = padY + usableH - normY * usableH; // flip Y for North up
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const coords = {
    College: project(PLACES.College.lat, PLACES.College.lng),
    Station: project(PLACES.Station.lat, PLACES.Station.lng),
    Office:  project(PLACES.Office.lat, PLACES.Office.lng),
  };

  const fromPt = coords[from] || coords.College;
  const toPt = coords[to] || coords.Office;

  // Label offsets to avoid overlapping
  const labelOffsets = {
    College: { dx: 14, dy: 5, anchor: 'start' },
    Station: { dx: 0, dy: -14, anchor: 'middle' },
    Office:  { dx: -12, dy: 18, anchor: 'start' },
  };

  return (
    <div className={`route-map-card ${compact ? 'route-map-card--compact' : ''}`}>
      {/* Map View Area */}
      <div className="route-map__canvas-wrap">
        {!showLiveMap ? (
          <svg
            className="route-map__svg"
            viewBox="0 0 400 225"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-labelledby={`map-title-${from}-${to} map-desc-${from}-${to}`}
          >
            <title id={`map-title-${from}-${to}`}>Route schematic from {from} to {to}</title>
            <desc id={`map-desc-${from}-${to}`}>
              Schematic map showing shuttle route between {from} and {to}, about {distance}.
            </desc>

            <defs>
              {/* Subtle Grid Pattern */}
              <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="route-map__grid-line" />
              </pattern>

              {/* Directional Arrow Marker */}
              <marker
                id="route-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
              </marker>

              {/* Pulsing glow filter */}
              <filter id="accent-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background & Grid */}
            <rect width="100%" height="100%" rx="10" className="route-map__bg" />
            <rect width="100%" height="100%" rx="10" fill="url(#grid-pattern)" />

            {/* Base Network Roads (faint connections) */}
            <line x1={coords.Station.x} y1={coords.Station.y} x2={coords.College.x} y2={coords.College.y} className="route-map__road-base" />
            <line x1={coords.Station.x} y1={coords.Station.y} x2={coords.Office.x} y2={coords.Office.y} className="route-map__road-base" />
            <line x1={coords.Office.x} y1={coords.Office.y} x2={coords.College.x} y2={coords.College.y} className="route-map__road-base" />

            {/* Active Route Path with Directional Marker */}
            <line
              x1={fromPt.x}
              y1={fromPt.y}
              x2={toPt.x}
              y2={toPt.y}
              className="route-map__road-active"
              markerEnd="url(#route-arrow)"
            />

            {/* Stops Rendering */}
            {Object.entries(PLACES).map(([key, place]) => {
              const pt = coords[key];
              const isFrom = key === from;
              const isTo = key === to;
              const isActive = isFrom || isTo;
              const offset = labelOffsets[key] || { dx: 0, dy: 14, anchor: 'middle' };

              return (
                <g key={key} className={`route-map__stop ${isActive ? 'route-map__stop--active' : 'route-map__stop--muted'}`}>
                  <title>{place.label} {isFrom ? '(Origin)' : isTo ? '(Destination)' : ''}</title>

                  {/* Outer ring for active stops */}
                  {isActive && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isFrom ? 9 : 8}
                      className="route-map__pin-ring"
                    />
                  )}

                  {/* Pin core */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 5 : 3.5}
                    className={`route-map__pin-core ${isFrom ? 'route-map__pin-core--from' : isTo ? 'route-map__pin-core--to' : ''}`}
                  />

                  {/* Stop Label */}
                  <text
                    x={pt.x + offset.dx}
                    y={pt.y + offset.dy}
                    textAnchor={offset.anchor}
                    className={`route-map__label ${isActive ? 'route-map__label--active' : 'route-map__label--muted'}`}
                  >
                    {place.label}
                    {isFrom && ' (From)'}
                    {isTo && ' (To)'}
                  </text>
                </g>
              );
            })}

            {/* Compass Indicator */}
            <g transform="translate(372, 28)" className="route-map__compass" aria-hidden="true">
              <circle r="12" className="route-map__compass-bg" />
              <path d="M 0 -8 L 3 3 L 0 1 L -3 3 z" fill="var(--accent)" />
              <path d="M 0 8 L 3 3 L 0 1 L -3 3 z" fill="var(--text-muted)" opacity="0.6" />
              <text y="-10" textAnchor="middle" className="route-map__compass-text">N</text>
            </g>
          </svg>
        ) : (
          <div className="route-map__iframe-wrap">
            <iframe
              title={`OpenStreetMap for ${from} to ${to}`}
              src={osmUrl}
              className="route-map__iframe"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Meta Line: Distance & Route */}
      <div className="route-map__meta-line">
        <span>{from} to {to}, about {distance}</span>
      </div>

      {/* Action Buttons: Open Directions & Toggle Map */}
      <div className="route-map__actions">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost btn--sm route-map__btn"
          id={`btn-directions-${from.toLowerCase()}-${to.toLowerCase()}`}
          title="Open driving directions in Google Maps"
        >
          <ExternalLink size={14} strokeWidth={2} />
          <span>Open directions</span>
        </a>

        <button
          type="button"
          onClick={() => setShowLiveMap(prev => !prev)}
          className="btn btn--ghost btn--sm route-map__btn"
          id={`btn-toggle-map-${from.toLowerCase()}-${to.toLowerCase()}`}
          aria-pressed={showLiveMap}
          title={showLiveMap ? 'Switch to schematic map' : 'Switch to OpenStreetMap view'}
        >
          {showLiveMap ? (
            <>
              <Compass size={14} strokeWidth={2} />
              <span>Schematic</span>
            </>
          ) : (
            <>
              <Map size={14} strokeWidth={2} />
              <span>View on map</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
