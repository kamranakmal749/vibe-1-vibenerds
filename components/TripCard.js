'use client';
// components/TripCard.js — Sleek Trip Card with Lucide Icons & Dynamic Fare Badge

import { format } from './dateUtils';
import { Clock, Users, Car, Check, X, ArrowRight, Banknote, ShieldAlert } from 'lucide-react';

const STATUS_COLORS = {
  pending:     { bar: 'linear-gradient(90deg, #d97706, #f59e0b)', badge: 'pending' },
  confirmed:   { bar: 'linear-gradient(90deg, #059669, #10b981)', badge: 'confirmed' },
  clashed:     { bar: 'linear-gradient(90deg, #dc2626, #ef4444)', badge: 'clashed' },
  in_progress: { bar: 'linear-gradient(90deg, #2563eb, #3b82f6)', badge: 'in_progress' },
  completed:   { bar: 'linear-gradient(90deg, #8c7d72, #b8b2ac)', badge: 'completed' },
  cancelled:   { bar: 'linear-gradient(90deg, #52525b, #71717a)', badge: 'cancelled' },
};

export default function TripCard({ trip, actions }) {
  const colors = STATUS_COLORS[trip.status] || STATUS_COLORS.pending;
  const boarded = trip.passengers.filter(p => p.status === 'boarded').length;
  const missed  = trip.passengers.filter(p => p.status === 'missed').length;

  return (
    <div className="trip-card">
      <div className="trip-card__accent-bar" style={{ background: colors.bar }} />

      <div className="trip-card__header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div className="trip-card__route">
            <span>{trip.from}</span>
            <ArrowRight size={16} className="trip-card__arrow" />
            <span>{trip.to}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Requested by <strong style={{ color: 'var(--text-secondary)' }}>{trip.requesterName}</strong>
          </div>
        </div>
        <span className={`badge badge--${colors.badge}`}>
          {trip.status.replace('_', ' ')}
        </span>
      </div>

      <div className="trip-card__meta">
        <div className="trip-card__meta-item">
          <Clock size={15} style={{ color: 'var(--accent-soft)' }} />
          <span>{format(trip.scheduledAt)}</span>
        </div>
        <div className="trip-card__meta-item">
          <Users size={15} style={{ color: 'var(--accent-soft)' }} />
          <span>{trip.passengers.length} passenger{trip.passengers.length !== 1 ? 's' : ''}</span>
        </div>
        {trip.rider && (
          <div className="trip-card__meta-item">
            <Car size={15} style={{ color: 'var(--accent-soft)' }} />
            <span>{trip.rider?.name || 'Rider assigned'}</span>
          </div>
        )}
        <div className="fare-display">
          <Banknote size={16} style={{ color: 'var(--success-soft)', marginRight: '0.25rem' }} />
          <span className="fare-display__amount">৳{trip.totalFare}</span>
          <span className="fare-display__label">
            {trip.status === 'completed' ? 'final' : (boarded > 0 ? `${boarded} boarded` : 'est max')}
          </span>
        </div>
      </div>

      {/* Passengers */}
      <div>
        <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Passenger Roster
        </div>
        <div className="trip-card__passengers">
          {trip.passengers.map((p, i) => (
            <span key={i} className={`passenger-chip passenger-chip--${p.status}`}>
              {p.status === 'boarded' ? <Check size={12} /> : p.status === 'missed' ? <X size={12} /> : '·'}
              {p.name}
            </span>
          ))}
        </div>
        {(boarded > 0 || missed > 0) && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--success-soft)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Check size={13} /> {boarded} boarded
            </span>
            {missed > 0 && (
              <span style={{ color: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <X size={13} /> {missed} missed
              </span>
            )}
          </div>
        )}
      </div>

      {actions && (
        <div className="trip-card__footer">
          <div className="trip-card__actions">{actions}</div>
        </div>
      )}
    </div>
  );
}
