'use client';
// app/dashboard/history/page.js — Student & Employee "My Trips" History

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import TripCard from '@/components/TripCard';
import { useAuth } from '@/context/AuthContext';
import { TRIP_STATUSES } from '@/lib/status';
import { Car, PlusCircle } from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all',                    label: 'All' },
  { value: TRIP_STATUSES.REQUESTED,  label: 'Requested' },
  { value: TRIP_STATUSES.ACCEPTED,   label: 'Accepted' },
  { value: TRIP_STATUSES.PICKUP,     label: 'Pickup' },
  { value: TRIP_STATUSES.DONE,       label: 'Done' },
  { value: TRIP_STATUSES.CLASH,      label: 'Clash' },
];

const EMPTY_FILTER_MESSAGES = {
  all: 'Book a ride to get started.',
  [TRIP_STATUSES.REQUESTED]: 'No requested trips yet',
  [TRIP_STATUSES.ACCEPTED]: 'No accepted trips yet',
  [TRIP_STATUSES.PICKUP]: 'No pickup trips yet',
  [TRIP_STATUSES.DONE]: 'No done trips yet',
  [TRIP_STATUSES.CLASH]: 'No clashed trips yet',
};

export default function MyTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const pollIntervalRef = useRef(null);

  const loadTrips = useCallback(async (selectedFilter) => {
    const activeFilter = selectedFilter !== undefined ? selectedFilter : filter;
    const url = activeFilter === 'all' ? '/api/trips?limit=50' : `/api/trips?limit=50&status=${activeFilter}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      } else {
        setTrips([]);
      }
    } catch {
      // network error
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleFilterChange = (newFilter) => {
    if (newFilter === filter) return;
    setLoading(true);
    setTrips([]);
    setFilter(newFilter);
    loadTrips(newFilter);
  };

  useEffect(() => {
    setLoading(true);
    loadTrips(filter);
  }, []);

  // Auto-poll every 10s if any trip is in Requested, Accepted, or Pickup
  useEffect(() => {
    const hasActive = trips.some(t => [TRIP_STATUSES.REQUESTED, TRIP_STATUSES.ACCEPTED, TRIP_STATUSES.PICKUP].includes(t.status));
    if (hasActive) {
      pollIntervalRef.current = setInterval(() => loadTrips(filter), 10000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [trips, filter, loadTrips]);

  const emptySubMessage = EMPTY_FILTER_MESSAGES[filter] || `No ${filter.toLowerCase()} trips yet`;

  return (
    <div>
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.875rem', fontWeight: 800 }}>
          My trips
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Every ride you filed or joined as a passenger.
        </p>
      </div>

      {/* Status Filter Chips Directly Under Title */}
      <div style={{ display: 'flex', gap: '0.4375rem', flexWrap: 'wrap', marginBottom: '1.5rem' }} role="tablist" aria-label="Filter trips by status">
        {STATUS_FILTERS.map(s => (
          <button
            key={s.value}
            id={`filter-chip-${s.value}`}
            type="button"
            className={`btn btn--sm ${filter === s.value ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => handleFilterChange(s.value)}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : trips.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem 1.5rem' }}>
          <div className="accent-circle" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--accent-soft)' }}>
            <Car size={22} strokeWidth={2} />
          </div>
          <div className="empty-state__title" style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Nothing here yet.
          </div>
          <div className="empty-state__sub" style={{ marginBottom: '1rem', fontSize: '0.84375rem', color: 'var(--text-muted)' }}>
            {emptySubMessage}
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
  );
}
