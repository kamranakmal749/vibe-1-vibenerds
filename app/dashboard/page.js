'use client';
// app/dashboard/page.js — Dashboard Overview (Auto-polling active trips, real statuses & explanations)

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TripCard from '@/components/TripCard';
import { formatRequestedAt } from '@/components/dateUtils';
import { TRIP_STATUSES } from '@/lib/status';
import { Car, PlusCircle, CheckCircle2, Clock, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef(null);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/trips?limit=10');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch {
      // ignore poll network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Poll every 10 seconds while there are active/pending trips
  useEffect(() => {
    const hasActive = trips.some(t => [TRIP_STATUSES.REQUESTED, TRIP_STATUSES.ACCEPTED, TRIP_STATUSES.PICKUP].includes(t.status));
    if (hasActive) {
      pollIntervalRef.current = setInterval(fetchTrips, 10000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [trips, fetchTrips]);

  const stats = {
    total: trips.length,
    accepted: trips.filter(t => t.status === TRIP_STATUSES.ACCEPTED).length,
    done: trips.filter(t => t.status === TRIP_STATUSES.DONE).length,
    clashed: trips.filter(t => t.status === TRIP_STATUSES.CLASH).length,
  };

  const nextRide = trips.find(t => [TRIP_STATUSES.ACCEPTED, TRIP_STATUSES.PICKUP].includes(t.status));
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div>
      {/* Header Row: Greeting & Single Request Button */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.875rem', fontWeight: 800 }}>
            Hey, {firstName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/dashboard/request"
          className="btn btn--primary"
          id="dashboard-header-request-btn"
        >
          <PlusCircle size={16} strokeWidth={2} />
          <span>Book a ride</span>
        </Link>
      </div>

      {/* Active Trip Hero Banner (If Accepted or Pickup) */}
      {nextRide && (
        <div className="alert alert--accent" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Car size={18} strokeWidth={2} style={{ color: 'var(--accent-soft)' }} />
            <div>
              <span>Current ride: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{nextRide.from} → {nextRide.to}</strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                ({formatRequestedAt(nextRide.requestedAt)})
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`status-pill ${nextRide.status === 'Accepted' ? 'status-pill--accepted' : 'status-pill--pickup'}`}>
              {nextRide.status}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {nextRide.status === 'Accepted'
                ? 'The Toto is yours. Head to the pickup point.'
                : 'Pickup in progress'}
            </span>
          </div>
        </div>
      )}

      {/* Responsive Stat Cards: Requests made, Accepted, Done, Clashed */}
      <div className="compact-stats" style={{ marginBottom: '1.75rem' }}>
        {/* Card 1: Requests made */}
        <div className="compact-stat">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="compact-stat__label">Requests made</span>
            <Activity size={17} strokeWidth={2} style={{ color: 'var(--accent-soft)' }} />
          </div>
          <div className={`compact-stat__value ${stats.total === 0 ? 'compact-stat__value--zero' : ''}`}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All requests</div>
        </div>

        {/* Card 2: Accepted */}
        <div className="compact-stat">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="compact-stat__label">Accepted</span>
            <CheckCircle2 size={17} strokeWidth={2} style={{ color: 'var(--success-soft)' }} />
          </div>
          <div className={`compact-stat__value ${stats.accepted === 0 ? 'compact-stat__value--zero' : ''}`} style={{ color: stats.accepted > 0 ? 'var(--success-soft)' : undefined }}>
            {stats.accepted}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upcoming rides</div>
        </div>

        {/* Card 3: Done */}
        <div className="compact-stat">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="compact-stat__label">Done</span>
            <Clock size={17} strokeWidth={2} style={{ color: 'var(--accent-soft)' }} />
          </div>
          <div className={`compact-stat__value ${stats.done === 0 ? 'compact-stat__value--zero' : ''}`}>
            {stats.done}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Finished trips</div>
        </div>

        {/* Card 4: Clashed */}
        <div className="compact-stat">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="compact-stat__label">Clashed</span>
            <AlertTriangle size={17} strokeWidth={2} style={{ color: stats.clashed > 0 ? 'var(--warning-soft)' : 'var(--text-muted)' }} />
          </div>
          <div className={`compact-stat__value ${stats.clashed === 0 ? 'compact-stat__value--zero' : ''}`} style={{ color: stats.clashed > 0 ? 'var(--warning-soft)' : undefined }}>
            {stats.clashed}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toto was busy</div>
        </div>
      </div>

      {/* Recent Requests Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 700 }}>
            Recent requests
          </h3>
          <Link href="/dashboard/history" className="btn btn--ghost btn--sm">
            All trips <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : trips.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="accent-circle" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--accent-soft)' }}>
              <Car size={22} strokeWidth={2} />
            </div>
            <div className="empty-state__title" style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Nothing here yet.
            </div>
            <div className="empty-state__sub" style={{ marginBottom: '1rem', fontSize: '0.84375rem', color: 'var(--text-muted)' }}>
              Book a ride to get started.
            </div>
            <Link href="/dashboard/request" className="btn btn--primary">
              <PlusCircle size={16} strokeWidth={2} /> Book now
            </Link>
          </div>
        ) : (
          <div className="trips-list">
            {trips.map(trip => (
              <TripCard key={trip._id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
