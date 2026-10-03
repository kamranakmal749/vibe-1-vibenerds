'use client';
// app/dashboard/track/page.js — Live track the toto for active confirmed/in_progress trip

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { format } from '@/components/dateUtils';

const TotoMap = dynamic(() => import('@/components/TotoMap'), { ssr: false });

export default function TrackPage() {
  const [activeTrip, setActiveTrip] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Load active trip
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/trips?status=confirmed&limit=1');
      const data = await res.json();
      let trip = data.trips?.[0] || null;
      if (!trip) {
        const res2 = await fetch('/api/trips?status=in_progress&limit=1');
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
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Live Tracking</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track your toto in real time</p>
      </div>

      {!activeTrip ? (
        <div className="empty-state">
          <div className="empty-state__icon">📍</div>
          <div className="empty-state__title">No active trip</div>
          <div className="empty-state__sub">
            You'll be able to track the toto once your ride is confirmed by the rider.
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
                  Pickup at {format(activeTrip.scheduledAt)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={`badge badge--${activeTrip.status}`}>{activeTrip.status.replace('_', ' ')}</span>
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
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>👥 Passengers</h3>
            <div className="trip-card__passengers">
              {activeTrip.passengers.map((p, i) => (
                <span key={i} className={`passenger-chip passenger-chip--${p.status}`}>
                  {p.status === 'boarded' ? '✓' : p.status === 'missed' ? '✕' : '·'} {p.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
