'use client';
// app/rider/history/page.js — Rider's full trip history

import { useState, useEffect } from 'react';
import TripCard from '@/components/TripCard';

const STATUS_OPTIONS = ['all', 'confirmed', 'in_progress', 'completed', 'clashed', 'cancelled'];

export default function RiderHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/trips?limit=50' : `/api/trips?limit=50&status=${filter}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setTrips(d.trips || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const stats = {
    total: trips.length,
    completed: trips.filter(t => t.status === 'completed').length,
    passengers: trips.reduce((acc, t) => acc + t.passengers.filter(p => p.status === 'boarded').length, 0),
    fare: trips.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.totalFare, 0),
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Trip History</h1>
        <p style={{ color: 'var(--text-muted)' }}>All trips you've handled as rider</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__label">Total Trips</div>
          <div className="stat-card__value">{stats.total}</div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__label">Completed</div>
          <div className="stat-card__value">{stats.completed}</div>
        </div>
        <div className="stat-card stat-card--warning">
          <div className="stat-card__label">Boarded</div>
          <div className="stat-card__value">{stats.passengers}</div>
          <div className="stat-card__sub">Passengers served</div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__label">Total Fares</div>
          <div className="stat-card__value">৳{stats.fare}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            id={`rider-filter-${s}`}
            className={`btn btn--sm ${filter === s ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">No trips found</div>
        </div>
      ) : (
        <div className="trips-list">
          {trips.map(trip => <TripCard key={trip._id} trip={trip} />)}
        </div>
      )}
    </div>
  );
}
