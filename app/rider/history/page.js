'use client';
// app/rider/history/page.js — Rider Trip History

import { useState, useEffect } from 'react';
import { formatRequestedAt } from '@/components/dateUtils';
import { TRIP_STATUSES, PASSENGER_STATUSES, TRIP_STATUS_DETAILS } from '@/lib/status';
import { fareTotal } from '@/lib/fare';
import RouteMap from '@/components/RouteMap';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  User,
  Users,
  IndianRupee,
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
  return TRIP_STATUS_DETAILS[status] || {
    label: status,
    pillClass: 'status-pill--requested',
    cardClass: 'trip-card--requested',
    message: 'Trip recorded.',
  };
};

export default function RiderHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [allTripsForStats, setAllTripsForStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [routeMapTrips, setRouteMapTrips] = useState({});

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
    done: allTripsForStats.filter(t => t.status === TRIP_STATUSES.DONE).length,
    boarded: allTripsForStats.reduce(
      (acc, t) => acc + (t.passengers?.filter(p => p.status === PASSENGER_STATUSES.BOARDED).length || 0),
      0
    ),
    missed: allTripsForStats.reduce(
      (acc, t) => acc + (t.passengers?.filter(p => p.status === PASSENGER_STATUSES.MISSED).length || 0),
      0
    ),
    fares: allTripsForStats
      .filter(t => t.status === TRIP_STATUSES.DONE)
      .reduce((acc, t) => {
        const boardedCount = t.passengers?.filter(p => p.status === PASSENGER_STATUSES.BOARDED).length || 0;
        const tripFare = t.fareTotal !== undefined ? t.fareTotal : fareTotal(t.from, t.to, boardedCount);
        return acc + tripFare;
      }, 0),
  };

  const toggleRouteMap = (tripId) => {
    setRouteMapTrips(prev => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  return (
    <div className="auth-animate-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.875rem', fontWeight: 800 }}>
          Trip history
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          All requests and completed trips
        </p>
      </div>

      {/* 1. Five Stat Cards Grid */}
      <div className="stats-grid">
        {/* Card 1: Total trips */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Total trips</span>
            <div className="stat-card__icon-wrap" style={{ background: 'var(--accent-glow)', color: 'var(--accent-soft)' }}>
              <Car size={18} strokeWidth={2} />
            </div>
          </div>
          <div className={`stat-card__value ${stats.total === 0 ? 'stat-card__value--zero' : ''}`}>
            {stats.total}
          </div>
          <div className="stat-card__sub">All requests filed</div>
        </div>

        {/* Card 2: Done */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Done</span>
            <div className="stat-card__icon-wrap" style={{ background: 'var(--success-bg)', color: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
              <CheckCircle2 size={18} strokeWidth={2} />
            </div>
          </div>
          <div className={`stat-card__value ${stats.done === 0 ? 'stat-card__value--zero' : ''}`} style={{ color: stats.done > 0 ? 'var(--success-soft)' : undefined }}>
            {stats.done}
          </div>
          <div className="stat-card__sub">Finished trips</div>
        </div>

        {/* Card 3: Boarded */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Boarded</span>
            <div className="stat-card__icon-wrap" style={{ background: 'var(--info-bg)', color: 'var(--info-soft)' }}>
              <UserCheck size={18} strokeWidth={2} />
            </div>
          </div>
          <div className={`stat-card__value ${stats.boarded === 0 ? 'stat-card__value--zero' : ''}`} style={{ color: stats.boarded > 0 ? 'var(--info-soft)' : undefined }}>
            {stats.boarded}
          </div>
          <div className="stat-card__sub">Passengers served</div>
        </div>

        {/* Card 4: Missed */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Missed</span>
            <div className="stat-card__icon-wrap" style={{ background: 'var(--danger-bg)', color: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
              <UserX size={18} strokeWidth={2} />
            </div>
          </div>
          <div className={`stat-card__value ${stats.missed === 0 ? 'stat-card__value--zero' : ''}`} style={{ color: stats.missed > 0 ? 'var(--danger-soft)' : undefined }}>
            {stats.missed}
          </div>
          <div className="stat-card__sub">No-shows recorded</div>
        </div>

        {/* Card 5: Fares collected */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Fares collected</span>
            <div className="stat-card__icon-wrap" style={{ background: 'var(--accent-glow)', color: 'var(--accent-soft)', border: '1px solid var(--border)' }}>
              <IndianRupee size={18} strokeWidth={2} />
            </div>
          </div>
          <div className={`stat-card__value ${stats.fares === 0 ? 'stat-card__value--zero' : ''}`} style={{ color: stats.fares > 0 ? 'var(--accent-soft)' : undefined }}>
            ₹{stats.fares}
          </div>
          <div className="stat-card__sub">From finished trips</div>
        </div>
      </div>

      {/* 2. Search & Filters Toolbar */}
      <div className="rider-toolbar">
        {/* Search Input on Left */}
        <div className="rider-toolbar__search-wrap">
          <Search size={18} className="rider-toolbar__search-icon" />
          <input
            type="text"
            className="rider-toolbar__search-input"
            placeholder="Search by name"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="rider-history-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="rider-toolbar__search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills on Right */}
        <div className="rider-toolbar__filters" role="tablist" aria-label="Filter trips by status">
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
                style={{ borderRadius: 'var(--radius-full)', minHeight: '38px', padding: '0.375rem 0.875rem' }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Trips List */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3.5rem 1.5rem' }}>
          <div className="accent-circle" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--accent-soft)' }}>
            <ClipboardList size={28} strokeWidth={2} />
          </div>
          <div className="empty-state__title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {searchQuery ? 'No trips match that name' : 'Nothing here yet.'}
          </div>
          <div className="empty-state__sub" style={{ maxWidth: 360, margin: '0.25rem auto 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {searchQuery
              ? `No trip records found naming "${searchQuery}".`
              : (activeFilter !== 'all' ? (TRIP_STATUS_DETAILS[activeFilter]?.emptyText || `No ${activeFilter.toLowerCase()} trips yet`) : 'Trips will show up here as they are created.')}
          </div>
        </div>
      ) : (
        <div className="trips-list">
          {trips.map(trip => {
            const statusInfo = getStatusDetails(trip.status);
            const isRouteOpen = !!routeMapTrips[trip._id];
            const headcount = trip.headcount || trip.passengers?.length || 1;

            return (
              <div
                key={trip._id}
                className={`trip-card ${statusInfo.cardClass || ''}`}
                id={`history-trip-${trip._id}`}
              >
                {/* Top Row: Route on Left, Status Pill on Right */}
                <div className="trip-card__header">
                  <div>
                    <div className="trip-card__route">
                      <span>{trip.from}</span>
                      <ArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{trip.to}</span>
                    </div>
                    <div className="trip-card__requester">
                      Requested by <span className="trip-card__requester-name">{trip.requesterName}</span>
                    </div>
                  </div>

                  <span className={`status-pill ${statusInfo.pillClass}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Meta Row: Clock, Passenger Count & Fare */}
                <div className="trip-card__meta">
                  <div className="trip-card__meta-item">
                    <Clock size={16} className="trip-card__meta-icon" />
                    <span>{formatRequestedAt(trip.requestedAt)}</span>
                  </div>
                  <div className="trip-card__meta-item">
                    <Users size={16} className="trip-card__meta-icon" />
                    <span>{headcount} passenger{headcount !== 1 ? 's' : ''}</span>
                  </div>
                  {trip.status === 'Done' && (
                    <div className="trip-card__meta-item">
                      <IndianRupee size={16} className="trip-card__meta-icon" />
                      <span>Fare: ₹{trip.fareTotal !== undefined ? trip.fareTotal : fareTotal(trip.from, trip.to, trip.passengers?.filter(p => p.status === 'Boarded').length || 0)} ({trip.passengers?.filter(p => p.status === 'Boarded').length || 0} boarded)</span>
                    </div>
                  )}
                </div>

                {/* Passengers Chips with Boarded/Missed/Pending Badges */}
                {trip.passengers && trip.passengers.length > 0 && (
                  <div className="trip-card__passengers-row">
                    {trip.passengers.map((p, idx) => {
                      const pStatus = p.status || 'Pending';
                      return (
                        <span key={idx} className="passenger-chip">
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{p.name}</span>

                          {pStatus === 'Boarded' && (
                            <span className="passenger-status-tag passenger-status-tag--boarded">
                              <Check size={11} strokeWidth={2.5} /> Boarded
                            </span>
                          )}
                          {pStatus === 'Missed' && (
                            <span className="passenger-status-tag passenger-status-tag--missed">
                              <X size={11} strokeWidth={2.5} /> Missed
                            </span>
                          )}
                          {pStatus === 'Pending' && (
                            <span className="passenger-status-tag passenger-status-tag--pending">
                              Pending
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Collapsible Route Map */}
                <div style={{ marginTop: '0.625rem' }}>
                  <button
                    type="button"
                    className="trip-card__route-toggle-btn"
                    onClick={() => toggleRouteMap(trip._id)}
                    aria-expanded={isRouteOpen}
                    id={`btn-route-toggle-${trip._id}`}
                  >
                    <MapPin size={13} />
                    <span>{isRouteOpen ? 'Hide route' : 'Show route'}</span>
                    {isRouteOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {isRouteOpen && (
                    <div className="trip-card__route-map-container">
                      <RouteMap from={trip.from} to={trip.to} compact={true} />
                    </div>
                  )}
                </div>

                {/* Footer Row: Explanation Message */}
                <div className="trip-card__footer">
                  <div className="trip-card__footer-msg">
                    {statusInfo.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
