'use client';
// app/dashboard/request/page.js — Request a ride form

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

const FARE_PER_KM = parseFloat(process.env.NEXT_PUBLIC_FARE_PER_KM || '5');
const DISTANCE_KM = parseFloat(process.env.NEXT_PUBLIC_ROUTE_DISTANCE_KM || '8');
const BASE_FARE = FARE_PER_KM * DISTANCE_KM;

export default function RequestPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    from: 'College Station',
    to: 'Office',
    scheduledAt: '',
    passengers: [{ name: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const swapRoute = () =>
    setForm(f => ({ ...f, from: f.to, to: f.from }));

  const addPassenger = () => {
    if (form.passengers.length >= 20) return;
    setForm(f => ({ ...f, passengers: [...f.passengers, { name: '' }] }));
  };

  const removePassenger = (i) =>
    setForm(f => ({ ...f, passengers: f.passengers.filter((_, idx) => idx !== i) }));

  const setPassengerName = (i, name) =>
    setForm(f => ({
      ...f,
      passengers: f.passengers.map((p, idx) => idx === i ? { ...p, name } : p),
    }));

  const estimatedFare = BASE_FARE * form.passengers.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const names = form.passengers.map(p => p.name.trim()).filter(Boolean);
    if (names.length !== form.passengers.length || names.some(n => !n)) {
      setError('Please fill in all passenger names.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: form.from,
          to: form.to,
          scheduledAt: form.scheduledAt,
          passengers: names.map(name => ({ name })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccess(data.trip);
      showToast('Ride requested! Waiting for rider to accept.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Request Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your trip from <strong>{success.from}</strong> to <strong>{success.to}</strong> has been sent to the rider.
          </p>
          <div className="card" style={{ maxWidth: 360, margin: '0 auto 2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="trip-card__meta-item">
                <span>📍</span> Route: <strong>{success.from} → {success.to}</strong>
              </div>
              <div className="trip-card__meta-item">
                <span>👥</span> Passengers: <strong>{success.passengers.length}</strong>
              </div>
              <div className="trip-card__meta-item">
                <span>💰</span> Total Fare: <strong style={{ color: 'var(--success-soft)' }}>৳{success.totalFare}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--ghost" onClick={() => setSuccess(null)} id="request-another-btn">
              Request Another
            </button>
            <button className="btn btn--primary" onClick={() => router.push('/dashboard/history')} id="view-trips-btn">
              View My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Request a Ride</h1>
        <p style={{ color: 'var(--text-muted)' }}>Fill in the details below. One person files for the whole group.</p>
      </div>

      <form onSubmit={handleSubmit} id="request-form" style={{ maxWidth: 600 }}>
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem' }}>🗺 Route</h3>
          <div className="grid-2" style={{ alignItems: 'end', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="trip-from">From</label>
              <select id="trip-from" className="form-select" value={form.from} onChange={set('from')}>
                <option value="College">College</option>
                <option value="Station">Station</option>
                <option value="Office">Office</option>
                <option value="College Station">College Station</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={swapRoute}
                title="Swap route"
                id="swap-route-btn"
                style={{ fontSize: '1.125rem' }}
              >⇄</button>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="trip-to">To</label>
              <select id="trip-to" className="form-select" value={form.to} onChange={set('to')}>
                <option value="Office">Office</option>
                <option value="College">College</option>
                <option value="Station">Station</option>
                <option value="College Station">College Station</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem' }}>🕐 Pickup Time</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="trip-time">When do you need the toto?</label>
            <input
              id="trip-time"
              type="datetime-local"
              className="form-input"
              value={form.scheduledAt}
              onChange={set('scheduledAt')}
              required
              min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
            />
            <span className="form-hint">Must be at least 5 minutes from now</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>👥 Passengers</h3>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={addPassenger}
              disabled={form.passengers.length >= 20}
              id="add-passenger-btn"
            >
              ＋ Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {form.passengers.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-soft)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <input
                  id={`passenger-name-${i}`}
                  type="text"
                  className="form-input"
                  placeholder={`Passenger ${i + 1} full name`}
                  value={p.name}
                  onChange={e => setPassengerName(i, e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                {form.passengers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm btn--icon"
                    onClick={() => removePassenger(i)}
                    id={`remove-passenger-${i}`}
                    title="Remove passenger"
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {/* Fare estimate */}
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Estimated Fare (Dynamic)</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>৳{BASE_FARE.toFixed(0)} / person × {form.passengers.length} requested</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-soft)', marginTop: '0.25rem' }}>⚡ Final fare recalculated automatically based on actual boarded passengers at pickup</div>
            </div>
            <div className="fare-display">
              <span className="fare-display__amount">৳{estimatedFare.toFixed(0)}</span>
              <span className="fare-display__label">est. max</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--full btn--lg"
          disabled={loading}
          id="request-submit-btn"
        >
          {loading ? 'Submitting…' : '🛺 Submit Request'}
        </button>
      </form>
    </div>
  );
}
