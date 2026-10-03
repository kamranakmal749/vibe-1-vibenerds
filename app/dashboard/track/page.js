'use client';
// app/dashboard/track/page.js — Live track the toto for active Accepted/Pickup trip

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { formatRequestedAt } from '@/components/dateUtils';

const TotoMap = dynamic(() => import('@/components/TotoMap'), { ssr: false });

export default function TrackPage() {
  const [activeTrip, setActiveTrip] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Load active trip
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/trips?status=Accepted&limit=1');
      const data = await res.json();
      let trip = data.trips?.[0] || null;
      if (!trip) {
        const res2 = await fetch('/api/trips?status=Pickup&limit=1');
        const data2 = await res2.json();
        trip = data2.trips?.[0] || null;
      }
      setActiveTrip(trip);
      setLoading(false);
    };
    load();
  }, []);

  // Poll rider location every 5s if trip active
  useEffect(() => {
    if (!activeTrip?.rider) return;
    const riderId = typeof activeTrip.rider === 'string' ? activeTrip.rider : activeTrip.rider._id;
    if (!riderId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/rider/location?riderId=${riderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.location?.lat) setRiderLocation(data.location);
        }
      } catch {}
    };

    poll();
    intervalRef.current = setInterval(poll, 5000);
    return () => clearInterval(intervalRef.current);
  }, [activeTrip]);

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Live tracking</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track the Toto during your ride</p>
      </div>

      {!activeTrip ? (
        <div className="empty-state">
          <div className="empty-state__icon">📍</div>
          <div className="empty-state__title">No active trip</div>
          <div className="empty-state__sub">
            You will be able to view the Toto once your ride request is accepted by the rider.
          </div>
        </div>
      ) : (
        <>
          {/* Trip info */}
          <div className="card card--glow" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Active Trip</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeTrip.from} → {activeTrip.to}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Requested {formatRequestedAt(activeTrip.requestedAt)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={`status-pill status-pill--${activeTrip.status.toLowerCase()}`}>{activeTrip.status}</span>
                {riderLocation ? (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--success-soft)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span className="pulse-dot" />
                    Toto live
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Awaiting location…</span>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <TotoMap
            from={activeTrip.from}
            to={activeTrip.to}
            riderLocation={riderLocation}
            height={420}
          />

          {/* Passengers */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Passengers</h3>
            <div className="trip-card__passengers">
              {activeTrip.passengers?.map((p, i) => (
                <span key={i} className={`passenger-chip passenger-chip--${p.status?.toLowerCase()}`}>
                  {p.status === 'Boarded' ? '✓' : p.status === 'Missed' ? '✕' : '·'} {p.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
