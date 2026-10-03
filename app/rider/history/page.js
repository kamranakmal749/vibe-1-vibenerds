'use client';
// app/rider/history/page.js — Rider Trip History

import { useState, useEffect } from 'react';
import { formatRequestedAt } from '@/components/dateUtils';
import { TRIP_STATUSES, PASSENGER_STATUSES, TRIP_STATUS_DETAILS } from '@/lib/status';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  User,
  Users,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Car,
  UserCheck,
  UserX,
  Search,
} from 'lucide-react';

const FILTER_PILLS = [
  { label: 'All',       value: 'all' },
  { label: 'Requested', value: TRIP_STATUSES.REQUESTED },
  { label: 'Accepted',  value: TRIP_STATUSES.ACCEPTED },
  { label: 'Pickup',    value: TRIP_STATUSES.PICKUP },
  { label: 'Done',      value: TRIP_STATUSES.DONE },
  { label: 'Clash',     value: TRIP_STATUSES.CLASH },
];

const getStatusDetails = (status) => {
  return TRIP_STATUS_DETAILS[status] || { label: status, pillClass: 'status-pill--requested' };
};

export default function RiderHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [allTripsForStats, setAllTripsForStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const fetchStats = () => {
    fetch('/api/trips?limit=200')
      .then(r => r.json())
      .then(d => {
        setAllTripsForStats(d.trips || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (activeFilter !== 'all') {
      params.set('status', activeFilter);
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    fetch(`/api/trips?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setTrips(d.trips || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeFilter, searchQuery]);

  const stats = {
    total: allTripsForStats.length,
    done: allTripsForStats.filter(t => t.status === 'Done').length,
    boarded: allTripsForStats.reduce(
      (acc, t) => acc + (t.passengers?.filter(p => p.status === 'Boarded').length || 0),
      0
    ),
    missed: allTripsForStats.reduce(
      (acc, t) => acc + (t.passengers?.filter(p => p.status === 'Missed').length || 0),
      0
    ),
  };

  const toggleRowExpand = (tripId) => {
    setExpandedRows(prev => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  return (
    <div className="auth-animate-in">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.875rem', fontWeight: 800 }}>
          Trip history
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          All requests and completed trips
        </p>
      </div>

      {/* 4-Card Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-soft)' }}>
            <Car size={18} strokeWidth={2} />
          </div>
          <div className="stat-card__label">Total trips</div>
          <div className={`stat-card__value ${stats.total === 0 ? 'compact-stat__value--zero' : ''}`}>
            {stats.total}
          </div>
          <div className="stat-card__sub">All requests filed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success-soft)' }}>
            <CheckCircle2 size={18} strokeWidth={2} />
          </div>
          <div className="stat-card__label">Done</div>
          <div className={`stat-card__value ${stats.done === 0 ? 'compact-stat__value--zero' : ''}`}>
            {stats.done}
          </div>
          <div className="stat-card__sub">Finished trips</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'var(--info-bg)', color: 'var(--info-soft)' }}>
            <UserCheck size={18} strokeWidth={2} />
          </div>
          <div className="stat-card__label">Boarded</div>
          <div className={`stat-card__value ${stats.boarded === 0 ? 'compact-stat__value--zero' : ''}`}>
            {stats.boarded}
          </div>
          <div className="stat-card__sub">Passengers served</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger-soft)' }}>
            <UserX size={18} strokeWidth={2} />
          </div>
          <div className="stat-card__label">Missed</div>
          <div className={`stat-card__value ${stats.missed === 0 ? 'compact-stat__value--zero' : ''}`}>
            {stats.missed}
          </div>
          <div className="stat-card__sub">No-shows recorded</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Name Search Input */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search by person name…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', minHeight: '40px', fontSize: '0.875rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '28px', height: '28px', minWidth: 'unset', minHeight: 'unset', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} role="tablist" aria-label="Filter history">
          {FILTER_PILLS.map(p => {
            const isActive = activeFilter === p.value;
            return (
              <button
                key={p.value}
                id={`rider-filter-${p.value}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`btn btn--sm ${isActive ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setActiveFilter(p.value)}
                style={{ borderRadius: 'var(--radius-full)', minHeight: '36px', padding: '0.375rem 0.875rem' }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem 1.5rem' }}>
          <div className="accent-circle" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--accent-soft)' }}>
            <ClipboardList size={28} strokeWidth={2} />
          </div>
          <div className="empty-state__title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Nothing here yet.
          </div>
          <div className="empty-state__sub" style={{ maxWidth: 360, margin: '0.25rem auto 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {activeFilter !== 'all'
              ? (TRIP_STATUS_DETAILS[activeFilter]?.emptyText || `No ${activeFilter.toLowerCase()} trips yet`)
              : (searchQuery ? `No trips found matching "${searchQuery}".` : 'Trips will show up here as they are created.')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {trips.map(trip => {
            const isExpanded = !!expandedRows[trip._id];
            const statusInfo = getStatusDetails(trip.status);

            return (
              <div
                key={trip._id}
                className="rider-card"
                id={`history-trip-${trip._id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <MapPin size={16} style={{ color: 'var(--accent-soft)' }} />
                      <span>{trip.from}</span>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{trip.to}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Requested by <strong style={{ color: 'var(--text-primary)' }}>{trip.requesterName}</strong>
                    </div>
                  </div>

                  <span className={`status-pill ${statusInfo.pillClass || statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={14} style={{ color: 'var(--accent-soft)' }} />
                    <span>{formatRequestedAt(trip.requestedAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Users size={14} style={{ color: 'var(--accent-soft)' }} />
                    <span>{trip.headcount || trip.passengers?.length || 1} passenger{(trip.headcount || trip.passengers?.length || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => toggleRowExpand(trip._id)}
                    style={{ padding: '0.3125rem 0.625rem', fontSize: '0.78125rem', gap: '0.375rem' }}
                    aria-expanded={isExpanded}
                  >
                    <span>Passengers ({trip.passengers?.length || 0})</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: '0.625rem', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {trip.passengers?.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84375rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                              <User size={14} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{p.name}</span>
                            </div>
                            <span
                              className={`badge badge--${(p.status || 'Pending').toLowerCase()}`}
                              style={{ fontSize: '0.6875rem' }}
                            >
                              {p.status === 'Boarded' && <Check size={11} />}
                              {p.status === 'Missed' && <X size={11} />}
                              <span>{p.status || 'Pending'}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
