'use client';
// app/dashboard/page.js — Bento Grid Dashboard Overview with Lucide Icons

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TripCard from '@/components/TripCard';
import { format } from '@/components/dateUtils';
import { Car, PlusCircle, CheckCircle, Clock, AlertTriangle, MapPin, Calendar, ArrowRight, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trips?limit=5')
      .then(r => r.json())
      .then(d => { setTrips(d.trips || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = {
    total: trips.length,
    confirmed: trips.filter(t => t.status === 'confirmed').length,
    completed: trips.filter(t => t.status === 'completed').length,
    clashed: trips.filter(t => t.status === 'clashed').length,
  };

  const activeTrip = trips.find(t => ['confirmed', 'in_progress'].includes(t.status));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Lawazia Toto Desk · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/dashboard/request"
          className="btn btn--primary btn--lg"
          id="quick-request-btn"
        >
          <PlusCircle size={18} />
          <span>Request a Ride</span>
        </Link>
      </div>

      {/* Active trip banner */}
      {activeTrip && (
        <div className="alert alert--info" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Car size={20} style={{ color: 'var(--info-soft)' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Active Trip Scheduled:</strong> {activeTrip.from} → {activeTrip.to} at {format(activeTrip.scheduledAt)}
            </div>
          </div>
          <Link href="/dashboard/track" className="btn btn--sm btn--ghost" style={{ background: 'var(--bg-card)' }}>
            <MapPin size={14} /> Track Live Toto
          </Link>
        </div>
      )}

      {/* Bento Grid Stats */}
      <div className="bento-grid" style={{ marginBottom: '2rem' }}>
        <div className="bento-col-3 card stat-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card__label">Total Requests</div>
            <Activity size={18} style={{ color: 'var(--accent-soft)' }} />
          </div>
          <div className="stat-card__value">{stats.total}</div>
          <div className="stat-card__sub">All time requested</div>
        </div>

        <div className="bento-col-3 card stat-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card__label">Confirmed</div>
            <CheckCircle size={18} style={{ color: 'var(--success-soft)' }} />
          </div>
          <div className="stat-card__value" style={{ color: 'var(--success-soft)' }}>{stats.confirmed}</div>
          <div className="stat-card__sub">Upcoming slots</div>
        </div>

        <div className="bento-col-3 card stat-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card__label">Completed</div>
            <Clock size={18} style={{ color: 'var(--accent-soft)' }} />
          </div>
          <div className="stat-card__value">{stats.completed}</div>
          <div className="stat-card__sub">Rides taken</div>
        </div>

        <div className="bento-col-3 card stat-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card__label">Clashed</div>
            <AlertTriangle size={18} style={{ color: 'var(--danger-soft)' }} />
          </div>
          <div className="stat-card__value" style={{ color: 'var(--danger-soft)' }}>{stats.clashed}</div>
          <div className="stat-card__sub">Conflicting requests</div>
        </div>
      </div>

      {/* Recent trips section */}
      <div className="section-header">
        <div>
          <div className="section-header__title">Recent Ride Requests</div>
          <div className="section-header__sub">Your latest 5 trips</div>
        </div>
        <Link href="/dashboard/history" className="btn btn--ghost btn--sm">
          View full history <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <Car size={40} className="empty-state__icon" />
          <div className="empty-state__title">No ride requests yet</div>
          <div className="empty-state__sub">Create your first ride request to shuttle between College, Station, and Office.</div>
          <Link href="/dashboard/request" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>
            <PlusCircle size={16} /> Request a Ride
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
