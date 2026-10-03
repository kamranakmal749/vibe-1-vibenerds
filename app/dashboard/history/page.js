'use client';
// app/dashboard/history/page.js — Full trip history for the logged-in user + passenger search

import { useState, useEffect, useCallback } from 'react';
import TripCard from '@/components/TripCard';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'clashed', 'in_progress', 'completed', 'cancelled'];

export default function HistoryPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Passenger search
  const [passengerSearch, setPassengerSearch] = useState('');
  const [passengerHistory, setPassengerHistory] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const url = filter === 'all' ? '/api/trips?limit=50' : `/api/trips?limit=50&status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setTrips(data.trips || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const handlePassengerSearch = async (e) => {
    e.preventDefault();
    if (!passengerSearch.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setPassengerHistory(null);
    try {
      const res = await fetch(`/api/history/passenger/${encodeURIComponent(passengerSearch.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassengerHistory(data);
    } catch (err) {
      setSearchError(err.message || 'Failed to search');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Trip History</h1>
        <p style={{ color: 'var(--text-muted)' }}>All your ride requests and their outcomes</p>
      </div>

      {/* Passenger search */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>🔍 Passenger History</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Look up any passenger's trip history by name
        </p>
        <form onSubmit={handlePassengerSearch} id="passenger-search-form">
          <div className="search-bar">
            <input
              id="passenger-search-input"
              type="text"
              className="form-input"
              placeholder="Enter passenger name…"
              value={passengerSearch}
              onChange={e => setPassengerSearch(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={searchLoading}
              id="passenger-search-btn"
            >
              {searchLoading ? '…' : 'Search'}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="alert alert--error" style={{ marginTop: '1rem' }}>
            <span>⚠</span> {searchError}
          </div>
        )}

        {passengerHistory && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              📜 {passengerHistory.passenger} — {passengerHistory.trips.length} trip{passengerHistory.trips.length !== 1 ? 's' : ''}
            </div>
            {passengerHistory.trips.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No trips found for this passenger.</div>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Scheduled</th>
                      <th>Trip Status</th>
                      <th>Boarded?</th>
                      <th>Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengerHistory.trips.map((t, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.from} → {t.to}</td>
                        <td>{new Date(t.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td><span className={`badge badge--${t.status}`}>{t.status.replace('_', ' ')}</span></td>
                        <td>
                          <span className={`badge badge--${t.passengerStatus}`}>
                            {t.passengerStatus}
                          </span>
                        </td>
                        <td style={{ color: 'var(--success-soft)', fontWeight: 600 }}>৳{t.farePerPerson}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trip filter tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            id={`filter-${s}`}
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
          <div className="empty-state__sub">
            {filter === 'all' ? "You haven't made any requests yet." : `No trips with status "${filter}".`}
          </div>
        </div>
      ) : (
        <div className="trips-list">
          {trips.map(trip => <TripCard key={trip._id} trip={trip} />)}
        </div>
      )}
    </div>
  );
}
